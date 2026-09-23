/**
 * KPI outcome evaluation for the software-development profile's Stage 6.
 *
 * Ingests KPI readings from a JSON array or a minimal CSV (date,value columns)
 * — the two source shapes the plan scopes for this first cut, before adding a
 * broader analytics-tool integration catalogue. A KPI with no reading inside
 * its measurement window is reported "pending", never guessed at from the
 * target/baseline alone.
 *
 * This file is byte-identical in cli/src/software-development/outcomes/kpi-tracker.js
 * and babok-mcp/src/lib/software-development/outcomes/kpi-tracker.js (enforced by
 * tests/unit/lib-parity.test.js).
 */

/**
 * @param {string} jsonText - a JSON array of { date: string, value: number }
 * @returns {Array<{ date: string, value: number }>}
 */
export function parseJsonReadings(jsonText) {
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch (err) {
    throw new Error(`parseJsonReadings: invalid JSON (${err.message})`);
  }
  if (!Array.isArray(data)) throw new Error('parseJsonReadings: expected a JSON array of { date, value } readings');
  return data.map((r, i) => {
    if (typeof r.date !== 'string' || typeof r.value !== 'number') {
      throw new Error(`parseJsonReadings: reading at index ${i} must be { date: string, value: number }`);
    }
    return { date: r.date, value: r.value };
  });
}

/**
 * Minimal CSV parser for the "date,value" shape (no quoted-field/embedded-comma
 * support — matches the scope declared for this first cut; a richer parser can
 * replace this without changing the function's contract).
 * @param {string} csvText
 * @returns {Array<{ date: string, value: number }>}
 */
export function parseCsvReadings(csvText) {
  const lines = csvText.trim().split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length === 0) return [];
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const dateIdx = header.indexOf('date');
  const valueIdx = header.indexOf('value');
  if (dateIdx === -1 || valueIdx === -1) {
    throw new Error('parseCsvReadings: CSV header must include "date" and "value" columns');
  }
  return lines.slice(1).map((line, i) => {
    const cols = line.split(',');
    const value = Number(cols[valueIdx]?.trim());
    if (Number.isNaN(value)) throw new Error(`parseCsvReadings: row ${i + 1} has a non-numeric value`);
    return { date: cols[dateIdx]?.trim(), value };
  });
}

/**
 * @param {{ id: string, unit?: string, baseline?: number, target?: number, direction?: 'increase'|'decrease', windowStart?: string, windowEnd?: string }} definition
 * @param {Array<{ date: string, value: number }>} readings
 * @returns {{
 *   id: string, status: 'pending'|'measured', latestValue: number|null, latestDate: string|null,
 *   achieved: boolean|null, readingsCount: number, unit: string|null, target: number|null, baseline: number|null, note: string,
 * }}
 */
export function evaluateKpi(definition, readings) {
  const { id, unit = null, baseline = null, target = null, direction = 'increase', windowStart, windowEnd } = definition;
  const inWindow = readings.filter(r => (!windowStart || r.date >= windowStart) && (!windowEnd || r.date <= windowEnd));

  if (inWindow.length === 0) {
    return {
      id, status: 'pending', latestValue: null, latestDate: null, achieved: null,
      readingsCount: 0, unit, target, baseline,
      note: 'No readings fall inside the KPI\'s measurement window yet — outcome is pending, not assumed.',
    };
  }

  const sorted = [...inWindow].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const latest = sorted[sorted.length - 1];
  const achieved = typeof target === 'number'
    ? (direction === 'decrease' ? latest.value <= target : latest.value >= target)
    : null;

  return {
    id,
    status: 'measured',
    latestValue: latest.value,
    latestDate: latest.date,
    achieved,
    readingsCount: inWindow.length,
    unit,
    target,
    baseline,
    note: typeof target === 'number'
      ? `Latest reading ${latest.value}${unit ? ` ${unit}` : ''} on ${latest.date} — target ${direction === 'decrease' ? '≤' : '≥'} ${target}.`
      : `Latest reading ${latest.value}${unit ? ` ${unit}` : ''} on ${latest.date} — no numeric target set, achievement not evaluated.`,
  };
}
