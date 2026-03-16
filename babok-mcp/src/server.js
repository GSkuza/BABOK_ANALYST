import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

import {
  STAGES,
  STAGE_FILE_NAMES,
  STAGE_PROMPT_FILE_NAMES,
  generateProjectId,
  listProjectIds,
  resolveProjectId,
  getProjectDir,
  getProjectsDir,
  getAgentStagesDir,
  getStagePrompt,
  getDeliverable,
} from './lib/project.js';

import {
  createJournal,
  readJournal,
  writeJournal,
  approveStage,
  rejectStage,
} from './lib/journal.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Helper: format journal summary for LLM consumption
// ─────────────────────────────────────────────────────────────────────────────

function journalSummary(journal) {
  const lines = [
    `Project: ${journal.project_name} (${journal.project_id})`,
    `Language: ${journal.language || 'EN'}`,
    `Created: ${journal.created_at}`,
    `Last updated: ${journal.last_updated}`,
    `Current stage: ${journal.current_stage} — ${STAGES.find(s => s.stage === journal.current_stage)?.name || '?'}`,
    `Status: ${journal.current_status}`,
    '',
    'Stages:',
  ];

  for (const s of journal.stages) {
    const stamp = s.approved_at
      ? ` (approved ${s.approved_at.slice(0, 10)})`
      : s.started_at
        ? ` (started ${s.started_at.slice(0, 10)})`
        : '';
    const note = s.notes ? ` — ${s.notes}` : '';
    lines.push(`  Stage ${s.stage}: ${s.status.toUpperCase()}${stamp} — ${s.name}${note}`);
  }

  if (journal.decisions?.length) {
    lines.push('', 'Decisions:', ...journal.decisions.map(d => `  - ${JSON.stringify(d)}`));
  }
  if (journal.assumptions?.length) {
    lines.push('', 'Assumptions:', ...journal.assumptions.map(a => `  - ${JSON.stringify(a)}`));
  }
  if (journal.open_questions?.length) {
    lines.push('', 'Open questions:', ...journal.open_questions.map(q => `  - ${JSON.stringify(q)}`));
  }

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helper: fulltext search across all project MD files
// ─────────────────────────────────────────────────────────────────────────────

function searchProjectFiles(query) {
  const lowerQuery = query.toLowerCase();
  const results = [];
  const projectIds = listProjectIds();

  for (const projectId of projectIds) {
    const projectDir = getProjectDir(projectId);
    let journal = null;
    try { journal = readJournal(projectId); } catch { /* skip */ }

    const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const filePath = path.join(projectDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const matchingLines = [];

      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(lowerQuery)) {
          const contextStart = Math.max(0, idx - 1);
          const contextEnd = Math.min(lines.length - 1, idx + 1);
          matchingLines.push({
            line: idx + 1,
            context: lines.slice(contextStart, contextEnd + 1).join('\n'),
          });
        }
      });

      if (matchingLines.length > 0) {
        results.push({
          project_id: projectId,
          project_name: journal?.project_name || projectId,
          file,
          matches: matchingLines.slice(0, 5), // cap at 5 matches per file
        });
      }
    }
  }
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Create and configure server
// ─────────────────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'babok-mcp',
  version: '2.0.0',
});

// ─────────────────────────────────────────────────────────────────────────────
//  RESOURCES: Stage prompt files exposed as babok://stages/{n}
// ─────────────────────────────────────────────────────────────────────────────

for (const s of STAGES) {
  server.resource(
    `babok-stage-${s.stage}`,
    `babok://stages/${s.stage}`,
    { mimeType: 'text/markdown', description: `BABOK Agent prompt for Stage ${s.stage}: ${s.name}` },
    async (uri) => {
      const content = getStagePrompt(s.stage);
      if (!content) {
        return {
          contents: [{
            uri: uri.href,
            mimeType: 'text/markdown',
            text: `Stage ${s.stage} prompt file not found. Set BABOK_AGENT_DIR env var to the BABOK_AGENT/stages/ directory.`,
          }],
        };
      }
      return {
        contents: [{ uri: uri.href, mimeType: 'text/markdown', text: content }],
      };
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  TOOL 1: babok_new_project
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  'babok_new_project',
  'Create a new BABOK analysis project. Returns the project ID needed for all subsequent tools.',
  {
    name: z.string().min(1).describe('Project name (e.g. "ERP Integration for Acme Corp")'),
    language: z.enum(['EN', 'PL']).default('EN').describe('Analysis language: EN (English) or PL (Polish)'),
  },
  async ({ name, language }) => {
    const projectId = generateProjectId();
    const journal = createJournal(projectId, name, language);

    return {
      content: [{
        type: 'text',
        text: [
          '✅ NEW PROJECT CREATED',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          `  Project ID:   ${projectId}`,
          `  Project Name: ${journal.project_name}`,
          `  Language:     ${language}`,
          `  Created:      ${journal.created_at}`,
          `  Directory:    ${getProjectDir(projectId)}`,
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          `Current stage: Stage 0 — Project Charter (IN PROGRESS)`,
          '',
          'Next step: Call babok_get_stage with stage_n=0 to get the Stage 0 instructions,',
          'then work through the questions with the human before approving.',
          '',
          `Use project_id="${projectId}" for all subsequent tool calls.`,
        ].join('\n'),
      }],
    };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
//  TOOL 2: babok_list_projects
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  'babok_list_projects',
  'List all BABOK projects in the workspace. Returns project IDs, names, and current stage.',
  {},
  async () => {
    const ids = listProjectIds();
    if (ids.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No projects found. Use babok_new_project to create the first one.\n'
            + `Projects directory: ${getProjectsDir()}`,
        }],
      };
    }

    const rows = [];
    for (const id of ids) {
      try {
        const j = readJournal(id);
        const stageName = STAGES.find(s => s.stage === j.current_stage)?.name || '?';
        rows.push(`  ${id}  |  ${j.project_name}  |  Stage ${j.current_stage}: ${stageName}  |  ${j.current_status.toUpperCase()}`);
      } catch {
        rows.push(`  ${id}  |  [unreadable journal]`);
      }
    }

    return {
      content: [{
        type: 'text',
        text: ['BABOK Projects:', '━━━━━━━━━━━━━━━━', ...rows].join('\n'),
      }],
    };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
//  TOOL 3: babok_get_stage
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  'babok_get_stage',
  'Get full context for a project stage: instructions from the BABOK Agent prompt file + current journal state. Use this before starting work on any stage.',
  {
    project_id: z.string().describe('Full or partial project ID (e.g. "TK7X" or "BABOK-20260316-TK7X")'),
    stage_n: z.number().int().min(0).max(8).describe('Stage number (0–8)'),
  },
  async ({ project_id, stage_n }) => {
    const fullId = resolveProjectId(project_id);
    if (!fullId) throw new Error(`Project not found: ${project_id}`);

    const journal = readJournal(fullId);
    const stageInfo = journal.stages.find(s => s.stage === stage_n);
    if (!stageInfo) throw new Error(`Stage ${stage_n} not found in journal`);

    const prompt = getStagePrompt(stage_n);
    const deliverable = getDeliverable(fullId, stage_n);

    const sections = [];

    sections.push(`# Stage ${stage_n}: ${STAGES.find(s => s.stage === stage_n)?.name}`);
    sections.push(`**Project:** ${journal.project_name} (${fullId})`);
    sections.push(`**Stage Status:** ${stageInfo.status.toUpperCase()}`);

    if (stageInfo.started_at) sections.push(`**Started:** ${stageInfo.started_at}`);
    if (stageInfo.approved_at) sections.push(`**Approved:** ${stageInfo.approved_at}`);
    if (stageInfo.notes) sections.push(`**Notes:** ${stageInfo.notes}`);

    sections.push('');
    sections.push('## Journal Context');
    sections.push(journalSummary(journal));

    if (prompt) {
      sections.push('');
      sections.push('## Stage Instructions (BABOK Agent Prompt)');
      sections.push(prompt);
    } else {
      sections.push('');
      sections.push(`## Stage Instructions`);
      sections.push(`*(Prompt file not found — set BABOK_AGENT_DIR to the BABOK_AGENT/stages/ directory)*`);
    }

    if (deliverable) {
      sections.push('');
      sections.push('## Existing Deliverable');
      sections.push(deliverable);
    }

    return {
      content: [{ type: 'text', text: sections.join('\n') }],
    };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
//  TOOL 4: babok_approve_stage
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  'babok_approve_stage',
  'Approve a completed stage and advance to the next one. Call this after the human confirms the stage deliverable is satisfactory.',
  {
    project_id: z.string().describe('Full or partial project ID'),
    stage_n: z.number().int().min(0).max(8).describe('Stage number to approve (0–8)'),
    notes: z.string().optional().describe('Optional approval notes or summary of key decisions made'),
  },
  async ({ project_id, stage_n, notes }) => {
    const fullId = resolveProjectId(project_id);
    if (!fullId) throw new Error(`Project not found: ${project_id}`);

    const journal = approveStage(fullId, stage_n, notes);
    const nextStage = journal.stages.find(s => s.stage === stage_n + 1);

    const lines = [
      `✅ Stage ${stage_n} APPROVED`,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `  Project:  ${fullId}`,
      `  Stage:    ${stage_n} — ${STAGES.find(s => s.stage === stage_n)?.name}`,
      `  Approved: ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`,
    ];

    if (notes) lines.push(`  Notes:    ${notes}`);
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (nextStage) {
      lines.push(`\nNext: Stage ${nextStage.stage} — ${nextStage.name} (now IN PROGRESS)`);
      lines.push(`Call babok_get_stage with stage_n=${nextStage.stage} to continue.`);
    } else {
      lines.push('\n🎉 All stages complete! Project is DONE.');
      lines.push('Call babok_export to generate the final deliverables package.');
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
//  TOOL 5: babok_get_deliverable
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  'babok_get_deliverable',
  'Read the Markdown deliverable file for a specific stage. Returns the full document content.',
  {
    project_id: z.string().describe('Full or partial project ID'),
    stage_n: z.number().int().min(0).max(8).describe('Stage number (0–8)'),
  },
  async ({ project_id, stage_n }) => {
    const fullId = resolveProjectId(project_id);
    if (!fullId) throw new Error(`Project not found: ${project_id}`);

    const filename = STAGE_FILE_NAMES[stage_n];
    const content = getDeliverable(fullId, stage_n);

    if (!content) {
      const expectedPath = path.join(getProjectDir(fullId), filename);
      return {
        content: [{
          type: 'text',
          text: `No deliverable found for Stage ${stage_n}.\nExpected file: ${expectedPath}\n\nSave the AI-generated document there to make it available.`,
        }],
      };
    }

    return {
      content: [{ type: 'text', text: content }],
    };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
//  TOOL 6: babok_search
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  'babok_search',
  'Full-text search across all BABOK project deliverable files. Useful for finding previous decisions, requirements, or risk items across projects.',
  {
    query: z.string().min(1).describe('Search term or phrase (case-insensitive)'),
    project_id: z.string().optional().describe('Limit search to a specific project (optional)'),
  },
  async ({ query, project_id }) => {
    let results;

    if (project_id) {
      const fullId = resolveProjectId(project_id);
      if (!fullId) throw new Error(`Project not found: ${project_id}`);
      // search only that project — temporarily filter
      results = searchProjectFiles(query).filter(r => r.project_id === fullId);
    } else {
      results = searchProjectFiles(query);
    }

    if (results.length === 0) {
      return {
        content: [{ type: 'text', text: `No matches found for: "${query}"` }],
      };
    }

    const lines = [`Search results for: "${query}"`, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', ''];
    for (const r of results) {
      lines.push(`📁 ${r.project_id} — ${r.project_name} / ${r.file}`);
      for (const m of r.matches) {
        lines.push(`  Line ${m.line}:`);
        lines.push(m.context.split('\n').map(l => `    ${l}`).join('\n'));
      }
      lines.push('');
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
//  TOOL 7: babok_export
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  'babok_export',
  'Export all project deliverables (journal + stage MD files) to an output directory.',
  {
    project_id: z.string().describe('Full or partial project ID'),
    output_dir: z.string().optional().describe('Custom output directory path (default: ./export/<project_id>)'),
  },
  async ({ project_id, output_dir }) => {
    const fullId = resolveProjectId(project_id);
    if (!fullId) throw new Error(`Project not found: ${project_id}`);

    const journal = readJournal(fullId);
    const projectDir = getProjectDir(fullId);
    const exportDir = output_dir
      ? path.resolve(output_dir)
      : path.join(process.cwd(), 'export', fullId);

    fs.mkdirSync(exportDir, { recursive: true });

    const files = fs.readdirSync(projectDir);
    let copied = 0;
    for (const file of files) {
      if (file.endsWith('.json') || file.endsWith('.md')) {
        fs.copyFileSync(path.join(projectDir, file), path.join(exportDir, file));
        copied++;
      }
    }

    return {
      content: [{
        type: 'text',
        text: [
          '📦 PROJECT EXPORTED',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          `  Project:  ${fullId}`,
          `  Name:     ${journal.project_name}`,
          `  Files:    ${copied} file(s)`,
          `  Output:   ${exportDir}`,
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        ].join('\n'),
      }],
    };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
//  TOOL 8: babok_save_deliverable
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  'babok_save_deliverable',
  'Save AI-generated stage content as a Markdown deliverable file in the project directory. Call this after generating a stage document to persist it.',
  {
    project_id: z.string().describe('Full or partial project ID'),
    stage_n: z.number().int().min(0).max(8).describe('Stage number (0–8)'),
    content: z.string().min(1).describe('Full Markdown content of the deliverable'),
  },
  async ({ project_id, stage_n, content }) => {
    const fullId = resolveProjectId(project_id);
    if (!fullId) throw new Error(`Project not found: ${project_id}`);

    const filename = STAGE_FILE_NAMES[stage_n];
    const filePath = path.join(getProjectDir(fullId), filename);

    fs.writeFileSync(filePath, content, 'utf-8');

    // Update journal to record deliverable file
    const journal = readJournal(fullId);
    const stage = journal.stages.find(s => s.stage === stage_n);
    if (stage) {
      stage.deliverable_file = filename;
      if (stage.status === 'in_progress') stage.status = 'completed';
      if (!stage.completed_at) stage.completed_at = new Date().toISOString();
      writeJournal(fullId, journal);
    }

    return {
      content: [{
        type: 'text',
        text: [
          `✅ Deliverable saved`,
          `  File: ${filePath}`,
          `  Stage: ${stage_n} — ${STAGES.find(s => s.stage === stage_n)?.name}`,
          `  Size: ${content.length} characters`,
          '',
          'Stage status updated to COMPLETED. Call babok_approve_stage to advance.',
        ].join('\n'),
      }],
    };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
//  Start server
// ─────────────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
