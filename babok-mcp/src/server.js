import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
//  TOOL 9: babok_rename_project
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  'babok_rename_project',
  'Rename an existing BABOK project. Updates the project_name in the journal; the directory ID does not change.',
  {
    project_id: z.string().describe('Full or partial project ID'),
    new_name: z.string().min(1).describe('New project name'),
  },
  async ({ project_id, new_name }) => {
    const fullId = resolveProjectId(project_id);
    if (!fullId) throw new Error(`Project not found: ${project_id}`);

    const journal = readJournal(fullId);
    const oldName = journal.project_name;

    if (oldName === new_name) {
      return { content: [{ type: 'text', text: `Project name is already "${new_name}". No change made.` }] };
    }

    journal.project_name = new_name;
    writeJournal(fullId, journal);

    return {
      content: [{
        type: 'text',
        text: [
          '✅ PROJECT RENAMED',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          `  ID:       ${fullId}`,
          `  Old name: ${oldName}`,
          `  New name: ${new_name}`,
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        ].join('\n'),
      }],
    };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
//  TOOL 10: babok_delete_project
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  'babok_delete_project',
  'Permanently delete a BABOK project and all its files. Requires explicit confirmation by passing the project ID as confirm_id.',
  {
    project_id: z.string().describe('Full or partial project ID to delete'),
    confirm_id: z.string().describe('Must match the full resolved project ID exactly — acts as deletion confirmation'),
  },
  async ({ project_id, confirm_id }) => {
    const fullId = resolveProjectId(project_id);
    if (!fullId) throw new Error(`Project not found: ${project_id}`);

    if (confirm_id !== fullId) {
      return {
        content: [{
          type: 'text',
          text: [
            '⛔ DELETION CANCELLED — confirmation mismatch.',
            `  Resolved project ID: ${fullId}`,
            `  confirm_id provided: ${confirm_id}`,
            '',
            'To confirm deletion, set confirm_id to the exact project ID shown above.',
          ].join('\n'),
        }],
      };
    }

    let journal;
    try { journal = readJournal(fullId); } catch { journal = null; }
    const projectDir = getProjectDir(fullId);

    fs.rmSync(projectDir, { recursive: true, force: true });

    return {
      content: [{
        type: 'text',
        text: [
          '🗑️  PROJECT DELETED',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          `  ID:   ${fullId}`,
          `  Name: ${journal?.project_name ?? '(unknown)'}`,
          `  Directory removed: ${projectDir}`,
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        ].join('\n'),
      }],
    };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
//  L2 Helpers
// ─────────────────────────────────────────────────────────────────────────────

const __mcpDirname = path.dirname(fileURLToPath(import.meta.url));

/** Map "stage1"..."stage8" → integer 1...8 */
const STAGE_KEY_TO_N = {
  stage1: 1, stage2: 2, stage3: 3, stage4: 4,
  stage5: 5, stage6: 6, stage7: 7, stage8: 8,
};

/** Resolve BABOK_AGENT/agents/ directory */
function getAgentConfigDir() {
  const cwdAgents = path.join(process.cwd(), 'BABOK_AGENT', 'agents');
  if (fs.existsSync(cwdAgents)) return cwdAgents;
  const relAgents = path.join(__mcpDirname, '..', '..', 'BABOK_AGENT', 'agents');
  if (fs.existsSync(relAgents)) return relAgents;
  return null;
}

/**
 * Call Gemini generateContent (non-streaming) with a single user turn.
 * Returns the response text or throws.
 */
async function callGemini(systemPrompt, userMessage, model = 'gemini-2.0-flash', temperature = 0.3) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is not set');

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
    generationConfig: { temperature, maxOutputTokens: 8192 },
  });
  const result = await geminiModel.generateContent(userMessage);
  return result.response.text();
}

// ─────────────────────────────────────────────────────────────────────────────
//  TOOL 11: babok_get_stage_artifact
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  'babok_get_stage_artifact',
  'Read the Markdown artefact file for a specific stage using the L2 stage key (e.g. "stage1"). Returns file content and metadata.',
  {
    project_id: z.string().describe('Full or partial project ID'),
    stage: z.enum(['stage1', 'stage2', 'stage3', 'stage4', 'stage5', 'stage6', 'stage7', 'stage8'])
      .describe('Stage key (e.g. "stage1")'),
  },
  async ({ project_id, stage }) => {
    const fullId = resolveProjectId(project_id);
    if (!fullId) throw new Error(`Project not found: ${project_id}`);

    const stageN = STAGE_KEY_TO_N[stage];
    const filename = STAGE_FILE_NAMES[stageN];
    const filePath = path.join(getProjectDir(fullId), filename);

    if (!fs.existsSync(filePath)) {
      return {
        content: [{
          type: 'text',
          text: `No artefact found for ${stage}.\nExpected: ${filePath}\n\nUse babok_save_deliverable to persist the stage document first.`,
        }],
      };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const stats = fs.statSync(filePath);

    return {
      content: [{
        type: 'text',
        text: [
          `📄 STAGE ARTEFACT — ${stage} (Stage ${stageN})`,
          `File: ${filePath}`,
          `Size: ${stats.size} bytes | Modified: ${stats.mtime.toISOString()}`,
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          content,
        ].join('\n'),
      }],
    };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
//  TOOL 12: babok_quality_check
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  'babok_quality_check',
  'Run the BABOK Quality Audit Agent against a stage artefact using the quality scoring rubric. Requires GEMINI_API_KEY. Stores the quality report in the project journal.',
  {
    project_id: z.string().describe('Full or partial project ID (e.g. "BABOK-20260330-XXXX")'),
    stage: z.enum(['stage1', 'stage2', 'stage3', 'stage4', 'stage5', 'stage6', 'stage7', 'stage8'])
      .describe('Stage to audit (e.g. "stage1")'),
    artifact_path: z.string().optional()
      .describe('Override: explicit path to artefact file. If omitted, resolved from project directory.'),
    iteration: z.number().int().min(1).max(3).default(1)
      .describe('Current iteration number (1–3)'),
    prior_issues: z.array(z.object({
      severity: z.string(),
      section: z.string(),
      description: z.string(),
    })).optional().describe('Issues from previous iteration to check were resolved'),
  },
  async ({ project_id, stage, artifact_path, iteration, prior_issues }) => {
    const fullId = resolveProjectId(project_id);
    if (!fullId) throw new Error(`Project not found: ${project_id}`);

    // Resolve artefact file
    const stageN = STAGE_KEY_TO_N[stage];
    let artifactContent;
    let resolvedPath;

    if (artifact_path) {
      resolvedPath = path.resolve(artifact_path);
    } else {
      resolvedPath = path.join(getProjectDir(fullId), STAGE_FILE_NAMES[stageN]);
    }

    if (!fs.existsSync(resolvedPath)) {
      return {
        content: [{
          type: 'text',
          text: `❌ Artefact not found: ${resolvedPath}\nRun the stage agent and save the deliverable first.`,
        }],
      };
    }
    artifactContent = fs.readFileSync(resolvedPath, 'utf-8');

    // Load quality audit system prompt
    const agentConfigDir = getAgentConfigDir();
    let systemPrompt = 'You are a BABOK quality auditor. Evaluate the artefact and return ONLY a JSON quality report.';
    if (agentConfigDir) {
      const promptPath = path.join(agentConfigDir, 'quality_audit_agent.md');
      if (fs.existsSync(promptPath)) {
        systemPrompt = fs.readFileSync(promptPath, 'utf-8');
      }
    }

    // Load quality scoring rubric
    let rubricText = '';
    if (agentConfigDir) {
      const rubricPath = path.join(agentConfigDir, 'quality_scoring_rubric.json');
      if (fs.existsSync(rubricPath)) {
        rubricText = fs.readFileSync(rubricPath, 'utf-8');
      }
    }

    // Build user message
    const stageName = STAGES.find(s => s.stage === stageN)?.name || stage;
    const priorIssuesText = (prior_issues?.length)
      ? `\n\nPRIOR ISSUES (iteration ${iteration - 1}):\n${JSON.stringify(prior_issues, null, 2)}`
      : '';

    const userMessage = [
      `## Audit Request`,
      `Stage: ${stage} — ${stageName}`,
      `Iteration: ${iteration} of 3`,
      priorIssuesText,
      '',
      '## Quality Scoring Rubric',
      rubricText || '(rubric file not found — use built-in BABOK v3 standards)',
      '',
      '## Artefact to Audit',
      artifactContent,
      '',
      'Return ONLY the JSON quality report as specified in the system prompt. No prose outside the JSON.',
    ].join('\n');

    let reportJson;
    try {
      const rawResponse = await callGemini(systemPrompt, userMessage, 'gemini-2.0-flash', 0.3);
      // Strip markdown code fences if present
      const cleaned = rawResponse.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
      reportJson = JSON.parse(cleaned);
    } catch (err) {
      // If LLM call or JSON parse fails, escalate to human
      const ts = new Date().toISOString();
      reportJson = {
        stage,
        timestamp: ts,
        iteration,
        scores: { completeness: 0, consistency: 0, quality: 0, overall: 0 },
        passed: false,
        issues: [{ severity: 'critical', section: 'Quality Check', description: `Quality check failed: ${err.message}`, recommendation: 'Check GEMINI_API_KEY and retry.' }],
        prior_issues_resolved: [],
        action: 'escalate_to_human',
      };
    }

    // Ensure required fields
    if (!reportJson.timestamp) reportJson.timestamp = new Date().toISOString();
    if (!reportJson.stage) reportJson.stage = stage;
    if (!reportJson.iteration) reportJson.iteration = iteration;

    // Persist quality report to journal
    try {
      const journal = readJournal(fullId);
      if (!journal.quality_reports) journal.quality_reports = {};
      journal.quality_reports[stage] = reportJson;
      writeJournal(fullId, journal);
    } catch {
      // Non-fatal — log but don't block response
    }

    const action = reportJson.action || (reportJson.passed ? 'approve' : 'iterate');
    const overallScore = reportJson.scores?.overall ?? reportJson.overall ?? 0;

    return {
      content: [{
        type: 'text',
        text: [
          `🔍 QUALITY CHECK — ${stage} (iteration ${iteration}/3)`,
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          `  Overall Score: ${overallScore}/100`,
          `  Passed:        ${reportJson.passed ? '✅ YES' : '❌ NO'}`,
          `  Action:        ${action.toUpperCase()}`,
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          JSON.stringify(reportJson, null, 2),
        ].join('\n'),
      }],
    };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
//  TOOL 13: babok_sync_stage_artifact
// ─────────────────────────────────────────────────────────────────────────────

server.tool(
  'babok_sync_stage_artifact',
  'Export a stage artefact to an external system: Confluence, SharePoint, or a local copy. Confluence requires CONFLUENCE_BASE_URL, CONFLUENCE_USER, CONFLUENCE_API_TOKEN. SharePoint requires SHAREPOINT_TENANT_ID, SHAREPOINT_CLIENT_ID, SHAREPOINT_CLIENT_SECRET.',
  {
    project_id: z.string().describe('Full or partial project ID'),
    stage: z.enum(['stage1', 'stage2', 'stage3', 'stage4', 'stage5', 'stage6', 'stage7', 'stage8', 'final'])
      .describe('Stage to sync'),
    target_system: z.enum(['confluence', 'sharepoint', 'local_copy'])
      .describe('Destination system'),
    overwrite_existing: z.boolean().default(true)
      .describe('Overwrite if destination already exists'),
    // local_copy fields
    destination_path: z.string().optional()
      .describe('[local_copy] Absolute destination path for the copy'),
    // confluence fields
    confluence_base_url: z.string().optional()
      .describe('[confluence] Base URL (overrides CONFLUENCE_BASE_URL env var)'),
    confluence_space_key: z.string().optional()
      .describe('[confluence] Space key (e.g. "BA")'),
    confluence_parent_page_id: z.string().optional()
      .describe('[confluence] Parent page ID'),
    confluence_page_title_prefix: z.string().default('BABOK')
      .describe('[confluence] Page title prefix'),
    // sharepoint fields
    sharepoint_site_url: z.string().optional()
      .describe('[sharepoint] SharePoint site URL'),
    sharepoint_library: z.string().optional()
      .describe('[sharepoint] Document library name'),
    sharepoint_folder_path: z.string().optional()
      .describe('[sharepoint] Folder path within the library'),
  },
  async ({ project_id, stage, target_system, overwrite_existing,
    destination_path, confluence_base_url, confluence_space_key,
    confluence_parent_page_id, confluence_page_title_prefix,
    sharepoint_site_url, sharepoint_library, sharepoint_folder_path }) => {

    const fullId = resolveProjectId(project_id);
    if (!fullId) throw new Error(`Project not found: ${project_id}`);

    // Resolve artefact path
    let artifactFilePath;
    if (stage === 'final') {
      artifactFilePath = path.join(getProjectDir(fullId), 'FINAL_Complete_Documentation.md');
    } else {
      const stageN = STAGE_KEY_TO_N[stage];
      artifactFilePath = path.join(getProjectDir(fullId), STAGE_FILE_NAMES[stageN]);
    }

    if (!fs.existsSync(artifactFilePath)) {
      return {
        content: [{
          type: 'text',
          text: `❌ Artefact not found: ${artifactFilePath}`,
        }],
      };
    }

    const artifactContent = fs.readFileSync(artifactFilePath, 'utf-8');
    const artifactSizeBytes = Buffer.byteLength(artifactContent, 'utf-8');
    const syncedAt = new Date().toISOString();

    if (target_system === 'local_copy') {
      if (!destination_path) {
        return {
          content: [{ type: 'text', text: '❌ destination_path is required for local_copy target.' }],
        };
      }
      const destPath = path.resolve(destination_path);
      if (fs.existsSync(destPath) && !overwrite_existing) {
        return {
          content: [{ type: 'text', text: `⏭️  Skipped — file already exists at ${destPath} (overwrite_existing=false)` }],
        };
      }
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(artifactFilePath, destPath);

      return {
        content: [{
          type: 'text',
          text: [
            `✅ ARTEFACT SYNCED — local_copy`,
            `  Source:      ${artifactFilePath}`,
            `  Destination: ${destPath}`,
            `  Size:        ${artifactSizeBytes} bytes`,
            `  Synced at:   ${syncedAt}`,
          ].join('\n'),
        }],
      };
    }

    if (target_system === 'confluence') {
      const baseUrl = confluence_base_url || process.env.CONFLUENCE_BASE_URL;
      const user = process.env.CONFLUENCE_USER;
      const token = process.env.CONFLUENCE_API_TOKEN;

      if (!baseUrl || !user || !token) {
        return {
          content: [{
            type: 'text',
            text: '❌ Missing Confluence credentials. Set CONFLUENCE_BASE_URL, CONFLUENCE_USER, CONFLUENCE_API_TOKEN environment variables.',
          }],
        };
      }
      if (!confluence_space_key) {
        return {
          content: [{ type: 'text', text: '❌ confluence_space_key is required for Confluence sync.' }],
        };
      }

      const pageTitle = `${confluence_page_title_prefix} — ${stage.toUpperCase()} ${STAGES.find(s => s.stage === STAGE_KEY_TO_N[stage])?.name || stage}`;
      const auth = Buffer.from(`${user}:${token}`).toString('base64');
      const apiBase = baseUrl.replace(/\/$/, '');

      // Convert Markdown to Confluence storage format (minimal conversion)
      const storageBody = artifactContent
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br/>');

      // Check if page exists
      const searchUrl = `${apiBase}/rest/api/content?title=${encodeURIComponent(pageTitle)}&spaceKey=${confluence_space_key}&expand=version`;
      let existingPageId = null;
      let existingVersion = null;

      try {
        const searchResp = await fetch(searchUrl, {
          headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
        });
        if (searchResp.ok) {
          const searchData = await searchResp.json();
          if (searchData.results?.length > 0) {
            existingPageId = searchData.results[0].id;
            existingVersion = searchData.results[0].version?.number ?? 1;
          }
        }
      } catch (e) {
        return { content: [{ type: 'text', text: `❌ Confluence API error (search): ${e.message}` }] };
      }

      if (existingPageId && !overwrite_existing) {
        return {
          content: [{ type: 'text', text: `⏭️  Skipped — Confluence page already exists (overwrite_existing=false). Page ID: ${existingPageId}` }],
        };
      }

      let pageUrl;
      try {
        if (existingPageId) {
          // Update existing page
          const updateBody = {
            version: { number: existingVersion + 1 },
            title: pageTitle,
            type: 'page',
            body: { storage: { value: storageBody, representation: 'storage' } },
          };
          const updateResp = await fetch(`${apiBase}/rest/api/content/${existingPageId}`, {
            method: 'PUT',
            headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(updateBody),
          });
          if (!updateResp.ok) {
            const errText = await updateResp.text();
            return { content: [{ type: 'text', text: `❌ Confluence update failed (${updateResp.status}): ${errText}` }] };
          }
          await updateResp.json(); // consume response body
          pageUrl = `${apiBase}/wiki/spaces/${confluence_space_key}/pages/${existingPageId}`;
        } else {
          // Create new page
          const createBody = {
            type: 'page',
            title: pageTitle,
            space: { key: confluence_space_key },
            body: { storage: { value: storageBody, representation: 'storage' } },
            ...(confluence_parent_page_id ? { ancestors: [{ id: confluence_parent_page_id }] } : {}),
          };
          const createResp = await fetch(`${apiBase}/rest/api/content`, {
            method: 'POST',
            headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(createBody),
          });
          if (!createResp.ok) {
            const errText = await createResp.text();
            return { content: [{ type: 'text', text: `❌ Confluence create failed (${createResp.status}): ${errText}` }] };
          }
          const createData = await createResp.json();
          pageUrl = `${apiBase}/wiki/spaces/${confluence_space_key}/pages/${createData.id}`;
        }
      } catch (e) {
        return { content: [{ type: 'text', text: `❌ Confluence API error: ${e.message}` }] };
      }

      return {
        content: [{
          type: 'text',
          text: [
            `✅ ARTEFACT SYNCED — Confluence`,
            `  Page:        ${pageTitle}`,
            `  URL:         ${pageUrl}`,
            `  Size:        ${artifactSizeBytes} bytes`,
            `  Synced at:   ${syncedAt}`,
          ].join('\n'),
        }],
      };
    }

    if (target_system === 'sharepoint') {
      const tenantId = process.env.SHAREPOINT_TENANT_ID;
      const clientId = process.env.SHAREPOINT_CLIENT_ID;
      const clientSecret = process.env.SHAREPOINT_CLIENT_SECRET;
      const siteUrl = sharepoint_site_url;

      if (!tenantId || !clientId || !clientSecret) {
        return {
          content: [{
            type: 'text',
            text: '❌ Missing SharePoint credentials. Set SHAREPOINT_TENANT_ID, SHAREPOINT_CLIENT_ID, SHAREPOINT_CLIENT_SECRET environment variables.',
          }],
        };
      }
      if (!siteUrl) {
        return { content: [{ type: 'text', text: '❌ sharepoint_site_url is required for SharePoint sync.' }] };
      }

      try {
        // Acquire OAuth token via client credentials
        const tokenResp = await fetch(
          `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: clientId,
              client_secret: clientSecret,
              scope: 'https://graph.microsoft.com/.default',
            }),
          }
        );
        if (!tokenResp.ok) {
          const errText = await tokenResp.text();
          return { content: [{ type: 'text', text: `❌ SharePoint token error (${tokenResp.status}): ${errText}` }] };
        }
        const tokenData = await tokenResp.json();
        const accessToken = tokenData.access_token;

        const filename = path.basename(artifactFilePath);
        const library = sharepoint_library || 'Documents';
        const folderPath = sharepoint_folder_path ? `/${sharepoint_folder_path}` : '';
        const uploadPath = `${folderPath}/${filename}`.replace(/\/\//g, '/');

        // Get Site ID from SharePoint URL
        const siteHostname = new URL(siteUrl).hostname;
        const sitePath = new URL(siteUrl).pathname.replace(/^\//, '');
        const siteInfoResp = await fetch(
          `https://graph.microsoft.com/v1.0/sites/${siteHostname}:/${sitePath}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!siteInfoResp.ok) {
          const errText = await siteInfoResp.text();
          return { content: [{ type: 'text', text: `❌ SharePoint site lookup failed (${siteInfoResp.status}): ${errText}` }] };
        }
        const siteInfo = await siteInfoResp.json();
        const siteId = siteInfo.id;

        // Get drive (document library) ID
        const drivesResp = await fetch(
          `https://graph.microsoft.com/v1.0/sites/${siteId}/drives`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!drivesResp.ok) {
          const errText = await drivesResp.text();
          return { content: [{ type: 'text', text: `❌ SharePoint drives lookup failed (${drivesResp.status}): ${errText}` }] };
        }
        const drivesData = await drivesResp.json();
        const drive = drivesData.value?.find(d => d.name === library) || drivesData.value?.[0];
        if (!drive) {
          return { content: [{ type: 'text', text: `❌ SharePoint library "${library}" not found.` }] };
        }

        // Upload file
        const uploadResp = await fetch(
          `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${drive.id}/root:${uploadPath}:/content`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'text/markdown',
            },
            body: artifactContent,
          }
        );
        if (!uploadResp.ok) {
          const errText = await uploadResp.text();
          return { content: [{ type: 'text', text: `❌ SharePoint upload failed (${uploadResp.status}): ${errText}` }] };
        }
        const uploadData = await uploadResp.json();
        const fileUrl = uploadData.webUrl || siteUrl;

        return {
          content: [{
            type: 'text',
            text: [
              `✅ ARTEFACT SYNCED — SharePoint`,
              `  File:        ${filename}`,
              `  URL:         ${fileUrl}`,
              `  Size:        ${artifactSizeBytes} bytes`,
              `  Synced at:   ${syncedAt}`,
            ].join('\n'),
          }],
        };
      } catch (e) {
        return { content: [{ type: 'text', text: `❌ SharePoint error: ${e.message}` }] };
      }
    }

    return { content: [{ type: 'text', text: `❌ Unknown target_system: ${target_system}` }] };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
//  TOOL 14: babok_create_jira_epic
// ─────────────────────────────────────────────────────────────────────────────

const JIRA_PRIORITY_MAP = {
  must_have: 'Highest',
  should_have: 'High',
  could_have: 'Medium',
  wont_have: 'Low',
};

server.tool(
  'babok_create_jira_epic',
  'Create Jira epics from Stage 4 requirements. Requires JIRA_BASE_URL, JIRA_USER, JIRA_API_TOKEN environment variables.',
  {
    project_key: z.string().regex(/^[A-Z][A-Z0-9_]+$/)
      .describe('Jira project key (e.g. "BABOK", "INV")'),
    requirements: z.array(z.object({
      id: z.string().describe('Requirement ID (e.g. "FR-001")'),
      title: z.string().max(255),
      description: z.string(),
      priority: z.enum(['must_have', 'should_have', 'could_have', 'wont_have']),
      acceptance_criteria: z.array(z.string()).optional(),
      labels: z.array(z.string()).optional(),
    })).min(1),
    epic_label_prefix: z.string().default('BABOK-Stage4')
      .describe('Label prefix applied to all created epics'),
    dry_run: z.boolean().default(false)
      .describe('If true, validates input without calling Jira API'),
  },
  async ({ project_key, requirements, epic_label_prefix, dry_run }) => {
    const baseUrl = process.env.JIRA_BASE_URL?.replace(/\/$/, '');
    const user = process.env.JIRA_USER;
    const token = process.env.JIRA_API_TOKEN;

    if (!dry_run && (!baseUrl || !user || !token)) {
      return {
        content: [{
          type: 'text',
          text: '❌ Missing Jira credentials. Set JIRA_BASE_URL, JIRA_USER, JIRA_API_TOKEN environment variables.',
        }],
      };
    }

    const auth = !dry_run ? Buffer.from(`${user}:${token}`).toString('base64') : '';
    const created = [];

    for (const req of requirements) {
      if (dry_run) {
        created.push({
          requirement_id: req.id,
          jira_key: `${project_key}-DRY`,
          jira_url: `${baseUrl || 'https://your-org.atlassian.net'}/browse/${project_key}-DRY`,
          status: 'skipped',
        });
        continue;
      }

      const acText = req.acceptance_criteria?.length
        ? '\n\n*Acceptance Criteria:*\n' + req.acceptance_criteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')
        : '';

      const issueBody = {
        fields: {
          project: { key: project_key },
          summary: `[${req.id}] ${req.title}`,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: req.description + acText }],
              },
            ],
          },
          issuetype: { name: 'Epic' },
          priority: { name: JIRA_PRIORITY_MAP[req.priority] || 'Medium' },
          labels: [epic_label_prefix, ...(req.labels || [])],
        },
      };

      try {
        const resp = await fetch(`${baseUrl}/rest/api/3/issue`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(issueBody),
        });

        if (!resp.ok) {
          const errText = await resp.text();
          created.push({ requirement_id: req.id, status: 'error', error: `HTTP ${resp.status}: ${errText}` });
        } else {
          const data = await resp.json();
          created.push({
            requirement_id: req.id,
            jira_key: data.key,
            jira_url: `${baseUrl}/browse/${data.key}`,
            status: 'created',
          });
        }
      } catch (e) {
        created.push({ requirement_id: req.id, status: 'error', error: e.message });
      }
    }

    const summary = {
      total: created.length,
      created: created.filter(c => c.status === 'created').length,
      skipped: created.filter(c => c.status === 'skipped').length,
      errors: created.filter(c => c.status === 'error').length,
    };

    const resultLines = created.map(c =>
      c.status === 'created'
        ? `  ✅ ${c.requirement_id} → ${c.jira_key} (${c.jira_url})`
        : c.status === 'skipped'
          ? `  ⏭️  ${c.requirement_id} → dry run`
          : `  ❌ ${c.requirement_id} → ${c.error}`
    );

    return {
      content: [{
        type: 'text',
        text: [
          `${dry_run ? '🔍 DRY RUN — ' : ''}JIRA EPICS`,
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          ...resultLines,
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          `Total: ${summary.total} | Created: ${summary.created} | Skipped: ${summary.skipped} | Errors: ${summary.errors}`,
        ].join('\n'),
      }],
    };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
//  TOOL 15: babok_create_github_issues
// ─────────────────────────────────────────────────────────────────────────────

const RISK_COLOR_MAP = {
  critical: 'd73a49',
  high: 'fb8c00',
  medium: 'ffd700',
  low: '28a745',
};

const CATEGORY_LABEL_COLOR = '0075ca';

function riskSeverity(likelihood, impact) {
  const scores = { low: 1, medium: 2, high: 3, critical: 4 };
  const score = (scores[likelihood] || 2) * (scores[impact] || 2);
  if (score >= 12) return 'critical';
  if (score >= 6) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

server.tool(
  'babok_create_github_issues',
  'Create GitHub Issues from a Stage 7 Risk Register. Requires GITHUB_TOKEN environment variable.',
  {
    owner: z.string().describe('GitHub repository owner (user or organisation)'),
    repo: z.string().describe('GitHub repository name'),
    risks: z.array(z.object({
      id: z.string().describe('Risk ID (e.g. "R-001")'),
      title: z.string().max(255),
      description: z.string(),
      likelihood: z.enum(['low', 'medium', 'high', 'critical']),
      impact: z.enum(['low', 'medium', 'high', 'critical']),
      mitigation: z.string(),
      owner: z.string().optional().describe('GitHub username to assign'),
      category: z.enum(['technical', 'financial', 'compliance', 'operational', 'strategic']).optional(),
    })).min(1),
    label_prefix: z.string().default('babok-risk')
      .describe('Prefix for auto-created labels'),
    milestone: z.string().optional()
      .describe('Milestone title to attach issues to'),
    dry_run: z.boolean().default(false),
  },
  async ({ owner, repo, risks, label_prefix, milestone, dry_run }) => {
    const token = process.env.GITHUB_TOKEN;

    if (!dry_run && !token) {
      return {
        content: [{
          type: 'text',
          text: '❌ Missing GITHUB_TOKEN environment variable.',
        }],
      };
    }

    const ghHeaders = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    };
    const apiBase = `https://api.github.com/repos/${owner}/${repo}`;

    // Resolve milestone number if provided
    let milestoneNumber = null;
    if (milestone && !dry_run) {
      try {
        const msResp = await fetch(`${apiBase}/milestones`, { headers: ghHeaders });
        if (msResp.ok) {
          const msData = await msResp.json();
          const found = msData.find(m => m.title === milestone);
          if (found) milestoneNumber = found.number;
        }
      } catch { /* non-fatal */ }
    }

    // Ensure labels exist
    const ensureLabel = async (name, colour) => {
      try {
        await fetch(`${apiBase}/labels`, {
          method: 'POST',
          headers: ghHeaders,
          body: JSON.stringify({ name, color: colour, description: 'BABOK auto-created label' }),
        });
      } catch { /* label may already exist */ }
    };

    const created = [];

    for (const risk of risks) {
      if (dry_run) {
        created.push({ risk_id: risk.id, issue_number: 0, issue_url: `https://github.com/${owner}/${repo}/issues/0`, status: 'skipped' });
        continue;
      }

      const severity = riskSeverity(risk.likelihood, risk.impact);
      const severityLabel = `${label_prefix}:${severity}`;
      const categoryLabel = risk.category ? `${label_prefix}:${risk.category}` : null;

      await ensureLabel(severityLabel, RISK_COLOR_MAP[severity] || '000000');
      if (categoryLabel) await ensureLabel(categoryLabel, CATEGORY_LABEL_COLOR);

      const labels = [severityLabel, ...(categoryLabel ? [categoryLabel] : [])];
      const body = [
        `## Risk: ${risk.id}`,
        '',
        `**Description:** ${risk.description}`,
        '',
        `**Likelihood:** ${risk.likelihood} | **Impact:** ${risk.impact} | **Severity:** ${severity}`,
        '',
        `## Mitigation`,
        risk.mitigation,
        '',
        `---`,
        `*Created by BABOK Quality Audit Agent — Stage 7 Risk Register*`,
      ].join('\n');

      const issuePayload = {
        title: `[${risk.id}] ${risk.title}`,
        body,
        labels,
        ...(risk.owner ? { assignees: [risk.owner] } : {}),
        ...(milestoneNumber ? { milestone: milestoneNumber } : {}),
      };

      try {
        const resp = await fetch(`${apiBase}/issues`, {
          method: 'POST',
          headers: ghHeaders,
          body: JSON.stringify(issuePayload),
        });

        if (!resp.ok) {
          const errText = await resp.text();
          created.push({ risk_id: risk.id, status: 'error', error: `HTTP ${resp.status}: ${errText}` });
        } else {
          const data = await resp.json();
          created.push({
            risk_id: risk.id,
            issue_number: data.number,
            issue_url: data.html_url,
            status: 'created',
          });
        }
      } catch (e) {
        created.push({ risk_id: risk.id, status: 'error', error: e.message });
      }
    }

    const summary = {
      total: created.length,
      created: created.filter(c => c.status === 'created').length,
      skipped: created.filter(c => c.status === 'skipped').length,
      errors: created.filter(c => c.status === 'error').length,
    };

    const resultLines = created.map(c =>
      c.status === 'created'
        ? `  ✅ ${c.risk_id} → #${c.issue_number} (${c.issue_url})`
        : c.status === 'skipped'
          ? `  ⏭️  ${c.risk_id} → dry run`
          : `  ❌ ${c.risk_id} → ${c.error}`
    );

    return {
      content: [{
        type: 'text',
        text: [
          `${dry_run ? '🔍 DRY RUN — ' : ''}GITHUB ISSUES`,
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          ...resultLines,
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          `Total: ${summary.total} | Created: ${summary.created} | Skipped: ${summary.skipped} | Errors: ${summary.errors}`,
        ].join('\n'),
      }],
    };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
//  TOOL 16: babok_read_external_context
// ─────────────────────────────────────────────────────────────────────────────

/** Strip HTML tags and collapse whitespace for plain-text extraction.
 * The output is plain text only — it is never rendered as HTML.
 * All tags are stripped by removing angle-bracket content in a single pass.
 */
function htmlToText(html) {
  // Strip all HTML tags in one pass (including any script/style content tags)
  let text = html.replace(/<[^>]*>/g, ' ');
  // Decode numeric character references
  text = text.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
  // Decode named entities — &amp; must come last to avoid double-decoding
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&amp;/g, '&');
  // Collapse whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

/** Extract headings only from text content */
function extractHeadings(text) {
  return text.split('\n')
    .filter(l => /^#{1,6}\s/.test(l) || /^[A-Z][^.!?]{5,80}$/.test(l.trim()))
    .slice(0, 50)
    .join('\n');
}

server.tool(
  'babok_read_external_context',
  'Read an external document (web URL or local file path) and return extracted text for use as context in stage agents. Supports HTML, Markdown, and plain text.',
  {
    source: z.string().describe('URL (https://...) or absolute local file path'),
    source_type: z.enum(['auto', 'html', 'markdown', 'text']).default('auto')
      .describe('Force source type; "auto" detects from URL/extension'),
    extract_mode: z.enum(['full', 'summary', 'headings_only']).default('full')
      .describe('"full" returns all content; "summary" returns first 2000 chars; "headings_only" returns headings'),
    max_chars: z.number().int().min(100).max(50000).default(16000)
      .describe('Maximum characters to return (truncated from end if exceeded)'),
    label: z.string().optional()
      .describe('Human-readable label for this context source'),
  },
  async ({ source, source_type, extract_mode, max_chars, label }) => {
    const effectiveLabel = label || source;
    let rawContent = '';
    let detectedType = source_type;
    let metadata = {};

    const isUrl = source.startsWith('http://') || source.startsWith('https://');

    if (isUrl) {
      // Security: only allow http/https URLs
      let url;
      try { url = new URL(source); } catch {
        return { content: [{ type: 'text', text: '❌ Invalid URL.' }] };
      }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return { content: [{ type: 'text', text: '❌ Only http:// and https:// URLs are allowed.' }] };
      }

      if (detectedType === 'auto') {
        if (source.endsWith('.md') || source.endsWith('.markdown')) detectedType = 'markdown';
        else if (source.endsWith('.txt')) detectedType = 'text';
        else detectedType = 'html';
      }

      try {
        const resp = await fetch(source, {
          headers: { 'User-Agent': 'BABOK-MCP/2.0 (babok-analyst; context-reader)' },
          signal: AbortSignal.timeout(15000),
        });
        if (!resp.ok) {
          return { content: [{ type: 'text', text: `❌ Fetch failed: HTTP ${resp.status} for ${source}` }] };
        }
        const contentType = resp.headers.get('content-type') || '';
        if (detectedType === 'auto' || detectedType === 'html') {
          detectedType = contentType.includes('text/html') ? 'html' : 'text';
        }
        rawContent = await resp.text();
        // Try to extract metadata from HTML <title> tag
        const titleMatch = rawContent.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) metadata.title = titleMatch[1].trim();
      } catch (e) {
        return { content: [{ type: 'text', text: `❌ Fetch error: ${e.message}` }] };
      }
    } else {
      // Local file
      const absPath = path.resolve(source);

      // Security: prevent path traversal — ensure path is absolute and accessible
      if (!path.isAbsolute(absPath)) {
        return { content: [{ type: 'text', text: '❌ Local path must be absolute.' }] };
      }
      if (!fs.existsSync(absPath)) {
        return { content: [{ type: 'text', text: `❌ File not found: ${absPath}` }] };
      }

      const stat = fs.statSync(absPath);
      if (!stat.isFile()) {
        return { content: [{ type: 'text', text: `❌ Path is not a file: ${absPath}` }] };
      }

      if (detectedType === 'auto') {
        const ext = path.extname(absPath).toLowerCase();
        if (ext === '.md' || ext === '.markdown') detectedType = 'markdown';
        else if (ext === '.html' || ext === '.htm') detectedType = 'html';
        else detectedType = 'text';
      }

      if (detectedType === 'pdf') {
        return {
          content: [{
            type: 'text',
            text: '❌ PDF extraction requires the optional "pdf-parse" npm package.\nInstall it with: npm install pdf-parse\nThen restart the MCP server.',
          }],
        };
      }

      rawContent = fs.readFileSync(absPath, 'utf-8');
      metadata.title = path.basename(absPath);
    }

    // Process content based on detected type
    let processedContent = rawContent;
    if (detectedType === 'html') {
      processedContent = htmlToText(rawContent);
    }

    // Apply extract mode
    let finalContent;
    if (extract_mode === 'headings_only') {
      finalContent = extractHeadings(processedContent);
    } else if (extract_mode === 'summary') {
      finalContent = processedContent.slice(0, 2000);
    } else {
      finalContent = processedContent;
    }

    // Truncate to max_chars
    const truncated = finalContent.length > max_chars;
    if (truncated) finalContent = finalContent.slice(0, max_chars);

    const wordCount = finalContent.split(/\s+/).filter(Boolean).length;
    metadata.word_count = wordCount;

    return {
      content: [{
        type: 'text',
        text: [
          `📚 EXTERNAL CONTEXT — ${effectiveLabel}`,
          `Source:      ${source}`,
          `Type:        ${detectedType}`,
          `Mode:        ${extract_mode}`,
          `Characters:  ${finalContent.length}${truncated ? ' (truncated)' : ''}`,
          `Words:       ${wordCount}`,
          ...(metadata.title ? [`Title:       ${metadata.title}`] : []),
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          finalContent,
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
