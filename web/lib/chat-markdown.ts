export function normalizeAgentMarkdown(content: string) {
  return content.replace(/\\([*_~`])/g, '$1');
}
