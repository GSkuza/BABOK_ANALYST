import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { saveStageDraft, StageContentError, withStageWriteLock } from './stage-content.ts';

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const AGENT_RUNNER = path.join(REPO_ROOT, 'scripts', 'web-stage-agent.mjs');
const MAX_MESSAGE_LENGTH = 20_000;
const MAX_TRANSCRIPT_LENGTH = 60_000;
const MAX_AGENT_OUTPUT_BYTES = 2 * 1024 * 1024;

export interface StageChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface Journal {
  project_id: string;
  project_name: string;
  profile?: string;
  language?: string;
  decisions?: Array<{ description?: string } | string>;
  assumptions?: string[];
  open_questions?: string[];
  stages: Array<{
    stage: number;
    name?: string;
    status: string;
    notes?: string;
    last_chat_at?: string;
    chat_message_count?: number;
  }>;
}

interface Profile {
  paths: { system_prompt: string; stages_dir: string };
  stages: Array<{ stage: number; prompt_file: string }>;
}

interface AgentResult {
  text: string;
  provider: string;
}

interface StageChatOptions {
  projectsDir?: string;
  profilesDir?: string;
  repositoryRoot?: string;
  provider?: string;
  agentRunner?: (
    systemPrompt: string,
    userPrompt: string,
    provider?: string,
  ) => Promise<AgentResult>;
}

export class StageChatError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'StageChatError';
    this.status = status;
  }
}

function getProjectsDir(options: StageChatOptions) {
  return options.projectsDir
    ?? (process.env.BABOK_PROJECTS_DIR ? path.resolve(process.env.BABOK_PROJECTS_DIR) : path.join(REPO_ROOT, 'projects'));
}

function getProjectPaths(projectId: string, stageNumber: number, options: StageChatOptions) {
  if (path.basename(projectId) !== projectId || !Number.isInteger(stageNumber) || stageNumber < 0) {
    throw new StageChatError('Invalid project or stage.');
  }
  const projectDir = path.join(getProjectsDir(options), projectId);
  const journalPath = path.join(projectDir, `PROJECT_JOURNAL_${projectId}.json`);
  const historyPath = path.join(projectDir, 'chat_history', `stage_${stageNumber}.json`);
  if (!fs.existsSync(/* turbopackIgnore: true */ journalPath)) {
    throw new StageChatError('Project not found.', 404);
  }
  return { projectDir, journalPath, historyPath };
}

function readJournal(journalPath: string) {
  return JSON.parse(
    fs.readFileSync(/* turbopackIgnore: true */ journalPath, 'utf-8'),
  ) as Journal;
}

export function getStageChatHistory(
  projectId: string,
  stageNumber: number,
  options: StageChatOptions = {},
): StageChatMessage[] {
  const { historyPath } = getProjectPaths(projectId, stageNumber, options);
  if (!fs.existsSync(/* turbopackIgnore: true */ historyPath)) return [];
  try {
    const history = JSON.parse(
      fs.readFileSync(/* turbopackIgnore: true */ historyPath, 'utf-8'),
    ) as { messages?: StageChatMessage[] };
    return Array.isArray(history.messages) ? history.messages : [];
  } catch {
    return [];
  }
}

function saveHistory(
  projectId: string,
  stageNumber: number,
  messages: StageChatMessage[],
  options: StageChatOptions,
) {
  const { projectDir, journalPath, historyPath } = getProjectPaths(projectId, stageNumber, options);
  withStageWriteLock(projectDir, stageNumber, () => {
    fs.mkdirSync(path.dirname(historyPath), { recursive: true });
    fs.writeFileSync(historyPath, `${JSON.stringify({
      project_id: projectId,
      stage: stageNumber,
      updated_at: new Date().toISOString(),
      message_count: messages.length,
      messages,
    }, null, 2)}\n`, 'utf-8');

    const journal = readJournal(journalPath);
    const stage = journal.stages.find((entry) => entry.stage === stageNumber);
    if (stage) {
      stage.last_chat_at = new Date().toISOString();
      stage.chat_message_count = messages.length;
    }
    fs.writeFileSync(journalPath, `${JSON.stringify(journal, null, 2)}\n`, 'utf-8');
  });
}

function messageText(message: StageChatMessage) {
  return message.parts.map((part) => part.text).join('');
}

function buildTranscript(messages: StageChatMessage[]) {
  const text = messages
    .slice(-40)
    .map((message) => `${message.role === 'user' ? 'USER' : 'ANALYST'}: ${messageText(message)}`)
    .join('\n\n');
  return text.slice(-MAX_TRANSCRIPT_LENGTH);
}

function listValues(values: unknown[] | undefined, formatter: (value: unknown) => string) {
  return values?.map(formatter).filter(Boolean).map((value) => `- ${value}`).join('\n') || '(none)';
}

function readPromptContext(journal: Journal, stageNumber: number, options: StageChatOptions) {
  const repositoryRoot = options.repositoryRoot ?? REPO_ROOT;
  const profilesDir = options.profilesDir ?? path.join(REPO_ROOT, 'profiles');
  const profilePath = path.join(profilesDir, journal.profile ?? 'babok', 'profile.json');
  if (!fs.existsSync(/* turbopackIgnore: true */ profilePath)) {
    throw new StageChatError(`Profile "${journal.profile ?? 'babok'}" is not available.`, 500);
  }
  const profile = JSON.parse(
    fs.readFileSync(/* turbopackIgnore: true */ profilePath, 'utf-8'),
  ) as Profile;
  const profileStage = profile.stages.find((entry) => entry.stage === stageNumber);
  if (!profileStage) throw new StageChatError('Stage is not configured in the project profile.', 500);

  const systemPromptPath = path.join(repositoryRoot, profile.paths.system_prompt);
  const stagePromptPath = path.join(repositoryRoot, profile.paths.stages_dir, profileStage.prompt_file);
  const elicitationPolicyPath = path.join(repositoryRoot, 'BABOK_AGENT', 'elicitation-policy.md');
  return {
    mainPrompt: fs.readFileSync(/* turbopackIgnore: true */ systemPromptPath, 'utf-8'),
    stagePrompt: fs.readFileSync(/* turbopackIgnore: true */ stagePromptPath, 'utf-8'),
    elicitationPolicy: fs.existsSync(/* turbopackIgnore: true */ elicitationPolicyPath)
      ? fs.readFileSync(/* turbopackIgnore: true */ elicitationPolicyPath, 'utf-8')
      : '',
  };
}

async function runAgent(
  systemPrompt: string,
  userPrompt: string,
  provider: string | undefined,
  options: StageChatOptions,
) {
  if (options.agentRunner) return options.agentRunner(systemPrompt, userPrompt, provider);
  return new Promise<AgentResult>((resolve, reject) => {
    const child = spawn(process.execPath, [AGENT_RUNNER], {
      cwd: REPO_ROOT,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => child.kill(), 11 * 60 * 1000);

    child.stdout.setEncoding('utf-8');
    child.stderr.setEncoding('utf-8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
      if (Buffer.byteLength(stdout, 'utf-8') > MAX_AGENT_OUTPUT_BYTES) {
        child.kill();
      }
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(new StageChatError(error.message, 502));
    });
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        try {
          resolve(JSON.parse(stdout) as AgentResult);
        } catch {
          reject(new StageChatError('AI agent returned an invalid response.', 502));
        }
        return;
      }
      const message = stderr.trim() || 'AI provider request failed';
      const status = /no configured llm provider|no api key/i.test(message) ? 503 : 502;
      reject(new StageChatError(message.replace(/^Error:\s*/i, ''), status));
    });
    child.stdin.end(JSON.stringify({ systemPrompt, userPrompt, provider }));
  });
}

function createAgentContext(
  projectId: string,
  stageNumber: number,
  messages: StageChatMessage[],
  options: StageChatOptions,
) {
  const { journalPath } = getProjectPaths(projectId, stageNumber, options);
  const journal = readJournal(journalPath);
  const stage = journal.stages.find((entry) => entry.stage === stageNumber);
  if (!stage) throw new StageChatError('Stage not found.', 404);
  const prompts = readPromptContext(journal, stageNumber, options);
  const language = journal.language === 'PL' ? 'Polish' : 'English';
  const systemPrompt = [
    prompts.mainPrompt,
    prompts.stagePrompt,
    prompts.elicitationPolicy,
    '=== WEB INTERVIEW CONTEXT ===',
    `Project: ${journal.project_name} (${journal.project_id})`,
    `Stage: ${stageNumber} - ${stage.name ?? `Stage ${stageNumber}`}`,
    `Stage status: ${stage.status}`,
    `Language: ${language}`,
    `Decisions:\n${listValues(journal.decisions, (value) => typeof value === 'string' ? value : String((value as { description?: string }).description ?? ''))}`,
    `Assumptions:\n${listValues(journal.assumptions, String)}`,
    `Open questions:\n${listValues(journal.open_questions, String)}`,
    'Conduct a decision-focused business-analysis interview. Apply the Analytical Elicitation Policy above.',
    'Use the transcript as an evidence ledger: do not repeat answered questions or mechanically follow the stage questionnaire.',
    'Do not invent facts, and do not generate the final deliverable unless explicitly instructed.',
    `Always respond in ${language}.`,
    '================================',
  ].join('\n\n');
  return { systemPrompt, transcript: buildTranscript(messages) };
}

export async function sendStageChatMessage(
  projectId: string,
  stageNumber: number,
  userMessage: string,
  options: StageChatOptions = {},
) {
  const message = userMessage.trim();
  if (!message) throw new StageChatError('Message cannot be empty.');
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new StageChatError('Message exceeds the 20,000 character limit.', 413);
  }

  const messages = getStageChatHistory(projectId, stageNumber, options);
  const context = createAgentContext(projectId, stageNumber, messages, options);
  const prompt = context.transcript
    ? `Conversation so far:\n\n${context.transcript}\n\nUSER: ${message}\n\nRespond as ANALYST.`
    : `Begin the interview from this user message:\n\nUSER: ${message}\n\nRespond as ANALYST.`;
  const response = await runAgent(context.systemPrompt, prompt, options.provider, options);
  const updatedMessages: StageChatMessage[] = [
    ...messages,
    { role: 'user', parts: [{ text: message }] },
    { role: 'model', parts: [{ text: response.text }] },
  ];
  saveHistory(projectId, stageNumber, updatedMessages, options);
  return { message: updatedMessages.at(-1)!, provider: response.provider };
}

export async function startStageInterview(
  projectId: string,
  stageNumber: number,
  options: StageChatOptions = {},
) {
  const messages = getStageChatHistory(projectId, stageNumber, options);
  if (messages.length > 0) {
    return { message: messages.at(-1)!, provider: '' };
  }
  const context = createAgentContext(projectId, stageNumber, messages, options);
  const response = await runAgent(
    context.systemPrompt,
    'Start directly without introducing yourself or explaining the process. State one tentative insight or hypothesis from the available project context in at most one sentence, then ask the single highest-value opening question. Keep the whole response under 60 words.',
    options.provider,
    options,
  );
  const firstMessage: StageChatMessage = {
    role: 'model',
    parts: [{ text: response.text }],
  };
  saveHistory(projectId, stageNumber, [firstMessage], options);
  return { message: firstMessage, provider: response.provider };
}

export async function generateStageDraftFromChat(
  projectId: string,
  stageNumber: number,
  options: StageChatOptions = {},
) {
  const messages = getStageChatHistory(projectId, stageNumber, options);
  if (messages.length < 2) throw new StageChatError('Start the interview before generating a draft.');
  const context = createAgentContext(projectId, stageNumber, messages, options);
  const prompt = [
    'Generate the complete stage deliverable now from the evidence in this conversation.',
    'Return only Markdown without code fences.',
    'Follow every required section from the stage instructions.',
    'Do not invent facts. Mark missing evidence as an explicit open question or assumption.',
    `Conversation:\n\n${context.transcript}`,
  ].join('\n\n');
  const response = await runAgent(context.systemPrompt, prompt, options.provider, options);

  try {
    const saved = saveStageDraft(projectId, stageNumber, response.text, {
      projectsDir: getProjectsDir(options),
      profilesDir: options.profilesDir,
      submitForReview: true,
    });
    const confirmation: StageChatMessage = {
      role: 'model',
      parts: [{ text: `Draft saved in ${saved.fileName} and submitted for review. Continue the interview if it needs refinement.` }],
    };
    saveHistory(projectId, stageNumber, [...messages, confirmation], options);
    return { draft: response.text, message: confirmation, provider: response.provider };
  } catch (error) {
    if (error instanceof StageContentError) throw new StageChatError(error.message, error.status);
    throw error;
  }
}
