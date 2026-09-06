/**
 * One LLM request per complete stage deliverable. The historical export name
 * and result shape remain compatible with CLI and orchestrator consumers.
 * Local quality checks report issues for human review, never auto-rewrite.
 */
import { scoreContent } from '../quality/score-content.js';

export async function generateStagedDeliverable({
  stageNumber, llmClient, systemPromptBase, userMessageIntro, rubric,
  stageRubric, batchGroups = [], options = {},
}) {
  const { onProgress } = options;
  const sections = [...new Set([
    ...batchGroups.flatMap(group => group.sections || []),
    ...(stageRubric?.required_sections || []),
  ])];
  const instructions = batchGroups
    .filter(group => group.instruction)
    .map(group => `- ${group.title || group.id}: ${group.instruction}`);
  const criteria = (stageRubric?.quality_criteria || [])
    .map(item => `- ${item.applies_to ? `${item.applies_to}: ` : ''}${item.description}`);
  const consistency = (stageRubric?.consistency_checks || [])
    .map(item => `- ${item.description}`);
  const prompt = `${systemPromptBase}\n\n=== COMPLETE DELIVERABLE: STAGE ${stageNumber} ===
Write the entire document in this response, using the section order below.
Keep the exact section headings for reliable validation; use the requested language for the body.
Be concise and specific: include evidence, decisions, owners and measurable criteria where supported.
Label missing data as unknown or an assumption. Do not invent numbers, sources or approvals.
Check section coverage and internal consistency before returning only the final Markdown document.
Do not describe drafting steps, reviews or future batches.
SECTIONS:
${sections.map(section => `## ${section}`).join('\n')}
SECTION INSTRUCTIONS (apply to this complete document):
${instructions.join('\n')}
QUALITY CRITERIA:
${criteria.join('\n')}
CONSISTENCY REQUIREMENTS:
${consistency.join('\n')}
=== END COMPLETE DELIVERABLE INSTRUCTIONS ===`;

  onProgress?.({ type: 'draft_started', sections });
  const finalDocument = await llmClient.chat(prompt, userMessageIntro,
    chunk => onProgress?.({ type: 'chunk', chunk }));
  if (typeof finalDocument !== 'string' || !finalDocument.trim()) {
    throw new Error('LLM returned an empty deliverable. No automatic retry was made.');
  }

  onProgress?.({ type: 'local_scoring' });
  const scored = await scoreContent(finalDocument, stageRubric || {}, rubric || {}, { stageNumber });
  const finalPass = {
    mode: 'single_call',
    validation: 'local',
    llmCalls: 1,
    finalScore: scored.scores.overall,
    iterations: 1,
    passed: scored.passed,
    issues: scored.issues,
  };
  onProgress?.({ type: 'generation_complete', finalPassMode: finalPass.mode, score: finalPass.finalScore, passed: finalPass.passed });
  return {
    finalDocument,
    batches: [{ id: 'full', iterations: 1, finalScore: finalPass.finalScore, passed: finalPass.passed }],
    finalPass,
  };
}
