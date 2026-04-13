import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.join(__dirname, 'prompts');

/**
 * Generate a Mermaid process diagram from a prose description.
 * @param {string} processDescription
 * @param {object} llmClient - { chat(systemPrompt, userMessage): Promise<string> }
 * @param {{ retry?: boolean }} [options]
 * @returns {Promise<{ mermaidSyntax: string, diagramType: 'flowchart'|'sequence', warnings: string[] }>}
 */
export async function generateProcessDiagram(processDescription, llmClient, options = {}) {
  const systemPrompt = fs.readFileSync(path.join(PROMPTS_DIR, 'process_to_mermaid.md'), 'utf-8');
  const warnings = [];

  async function callLlm(message) {
    const raw = await llmClient.chat(systemPrompt, message);
    // Extract mermaid block from response
    const fencedMatch = raw.match(/```mermaid\n([\s\S]*?)```/);
    if (fencedMatch) return fencedMatch[1].trim();
    // Fallback: look for flowchart or sequenceDiagram line
    const lines = raw.split('\n');
    const startIdx = lines.findIndex(l => /^(flowchart|sequenceDiagram)/.test(l.trim()));
    if (startIdx >= 0) return lines.slice(startIdx).join('\n').trim();
    return raw.trim();
  }

  function isValidMermaid(syntax) {
    return /^(flowchart|sequenceDiagram)/.test(syntax.trim()) && /-+>/.test(syntax);
  }

  let mermaidSyntax = await callLlm(processDescription);

  if (!isValidMermaid(mermaidSyntax) && options.retry !== false) {
    warnings.push('First attempt produced invalid Mermaid; retrying with error feedback');
    mermaidSyntax = await callLlm(
      processDescription + '\n\nPrevious attempt was invalid. Output ONLY a flowchart starting with "flowchart LR" or "flowchart TD".'
    );
  }

  if (!isValidMermaid(mermaidSyntax)) {
    warnings.push('Could not produce valid Mermaid syntax after retry');
  }

  const diagramType = mermaidSyntax.trim().startsWith('sequenceDiagram') ? 'sequence' : 'flowchart';
  return { mermaidSyntax, diagramType, warnings };
}
