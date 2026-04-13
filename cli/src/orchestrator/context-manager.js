import fs from 'fs';
import path from 'path';
import { getProjectDir } from '../project.js';

function getContextPath(projectId) {
  return path.join(getProjectDir(projectId), 'pipeline_context.json');
}

export function readContext(projectId) {
  const contextPath = getContextPath(projectId);
  if (!fs.existsSync(contextPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(contextPath, 'utf-8'));
  } catch {
    return {};
  }
}

export function writeContext(projectId, context) {
  const contextPath = getContextPath(projectId);
  fs.mkdirSync(path.dirname(contextPath), { recursive: true });
  fs.writeFileSync(contextPath, JSON.stringify(context, null, 2), 'utf-8');
}

export function mergeStageOutput(projectId, stageKey, output) {
  const context = readContext(projectId);
  context.stages = context.stages || {};
  context.stages[stageKey] = {
    status: 'completed',
    output,
    completedAt: new Date().toISOString(),
  };
  writeContext(projectId, context);
}
