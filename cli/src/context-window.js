function truncateText(text, maxChars) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

function compactWhitespace(text) {
  return String(text || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();
}

function excerptRelevantText(text, maxChars = 260) {
  const compact = compactWhitespace(text);
  if (compact.length <= maxChars) return compact;
  const matcher = /(Budget[^.]{0,120}|KPI[^.]{0,120}|FR-[A-Z0-9-]+[^.]{0,120}|NFR-[A-Z0-9-]+[^.]{0,120}|\b\d{4}-\d{2}-\d{2}\b[^.]{0,120}|\b\d+(?:[.,]\d+)?\s*(PLN|EUR|USD|days?|weeks?|months?|%|users?|hours?)\b[^.]{0,120})/i;
  const match = compact.match(matcher);
  if (!match || match.index == null) return truncateText(compact, maxChars);
  const start = Math.max(0, match.index - 40);
  const end = Math.min(compact.length, match.index + match[0].length + 40);
  return truncateText(compact.slice(start, end), maxChars);
}

function scoreLine(line) {
  let score = 0;
  if (/^##\s+/.test(line)) score += 5;
  if (/\b(FR|NFR|KPI|OPT|ROI|RISK|API|SLA)-?[A-Z0-9]*\b/i.test(line)) score += 4;
  if (/\b\d{4}-\d{2}-\d{2}\b/.test(line)) score += 3;
  if (/\b\d+(?:[.,]\d+)?\s*(PLN|EUR|USD|days?|weeks?|months?|%|users?|hours?)\b/i.test(line)) score += 3;
  if (/assumption|decision|risk|owner|deadline|budget|target|baseline/i.test(line)) score += 2;
  if (line.length > 20 && line.length < 220) score += 1;
  return score;
}

export function summarizeMarkdown(text, options = {}) {
  const {
    maxChars = 1800,
    maxLines = 16,
    headingBudget = 6,
  } = options;

  const raw = String(text || '').trim();
  if (!raw) return '';
  if (raw.length <= maxChars) return raw;

  const lines = raw.split('\n').map(line => line.trim()).filter(Boolean);
  const headings = [];
  const facts = [];
  const intro = [];

  for (const line of lines) {
    if (headings.length < headingBudget && /^##\s+/.test(line)) headings.push(line);
    if (intro.length < 4 && !/^##\s+/.test(line)) intro.push(excerptRelevantText(line));
  }

  const ranked = lines
    .map((line, index) => ({ line, index, score: scoreLine(line) }))
    .filter(entry => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index);

  const seen = new Set();
  const pushUnique = (target, line) => {
    const normalized = excerptRelevantText(line);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    target.push(normalized);
  };

  headings.forEach(line => pushUnique(facts, line));
  intro.forEach(line => pushUnique(facts, line));
  ranked.forEach(({ line }) => {
    if (facts.length < maxLines) pushUnique(facts, line);
  });

  return truncateText(facts.join('\n'), maxChars);
}

export function summarizeConversationHistory(messages, options = {}) {
  const {
    keepLastMessages = 8,
    maxSummaryChars = 1800,
  } = options;

  const history = Array.isArray(messages) ? messages : [];
  if (history.length <= keepLastMessages) {
    return { recentMessages: history, summary: '' };
  }

  const older = history.slice(0, -keepLastMessages);
  const recentMessages = history.slice(-keepLastMessages);
  const summaryLines = older.map((message, index) => {
    const role = message?.role === 'model' ? 'Agent' : 'User';
    const text = compactWhitespace(message?.parts?.[0]?.text || '');
    return `${index + 1}. ${role}: ${truncateText(text, 180)}`;
  });

  return {
    recentMessages,
    summary: truncateText(summaryLines.join('\n'), maxSummaryChars),
  };
}

export function summarizeStageOutputs(previousOutputs, profile, options = {}) {
  const entries = Object.entries(previousOutputs || {});
  if (entries.length === 0) return '';

  const {
    maxCharsPerStage = 1800,
  } = options;

  const parts = entries.map(([n, content]) => {
    const meta = profile.stages.find(stage => stage.stage === Number(n));
    const summary = summarizeMarkdown(content, { maxChars: maxCharsPerStage });
    return `--- Stage ${n}: ${meta?.name} ---\n${summary}`;
  });
  return `\n\n=== PREVIOUS STAGE OUTPUTS (summarized context) ===\n${parts.join('\n\n')}\n=== END PREVIOUS OUTPUTS ===`;
}

export function limitProjectContext(value, options = {}) {
  const {
    maxDepth = 4,
    maxStringChars = 1200,
    maxArrayItems = 12,
    maxObjectEntries = 20,
  } = options;

  if (value == null) return value;
  if (typeof value === 'string') return truncateText(value, maxStringChars);
  if (typeof value !== 'object') return value;
  if (maxDepth <= 0) return '[truncated]';

  if (Array.isArray(value)) {
    return value
      .slice(0, maxArrayItems)
      .map(item => limitProjectContext(item, {
        maxDepth: maxDepth - 1,
        maxStringChars,
        maxArrayItems,
        maxObjectEntries,
      }));
  }

  const limited = {};
  for (const [key, nested] of Object.entries(value).slice(0, maxObjectEntries)) {
    limited[key] = limitProjectContext(nested, {
      maxDepth: maxDepth - 1,
      maxStringChars,
      maxArrayItems,
      maxObjectEntries,
    });
  }
  return limited;
}
