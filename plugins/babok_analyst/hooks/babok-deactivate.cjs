#!/usr/bin/env node
// babok_analyst — SessionEnd cleanup hook. Clears the active-state flag set by babok-activate.cjs.

const { clearActive } = require('./babok-runtime.cjs');

try {
  clearActive();
} catch (e) {
  // best-effort — do not block session end
}
