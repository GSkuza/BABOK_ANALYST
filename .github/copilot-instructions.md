# Copilot Instructions for BABOK Analyst

Developer guide for working on the BABOK Analyst repository. This is a multi-interface business analysis platform implementing the BABOK v3 framework as a 9-stage pipeline (Stage 0 charter + Stages 1–8).

**Current Version:** 2.2.8 | **Node.js:** 18+ required | **Module System:** ESM throughout (`"type": "module"`)

---

## Build, Test & Lint Commands

### Root Workspace Tests

```bash
npm install                       # Install root dependencies
npm test                          # All tests: unit + integration + plugin/hook/uninstall
npm run check-versions            # Verify version sync across all package.json files
npm run sync-codex-plugin         # Regenerate .codex-plugin from .claude-plugin
```

**Run individual test files:**
```bash
node --test tests/unit/project.test.js
node --test tests/unit/journal.test.js
node --test tests/unit/two-key-gate.test.js
node --test tests/unit/scoring.test.js
node --test tests/unit/validation.test.js
node --test tests/unit/templates.test.js
node --test tests/integration/cli-workflow.test.js
node --test tests/plugin-manifest.test.cjs
node --test tests/hooks.test.cjs
```

### CLI (`cli/`)

```bash
cd cli
npm install
npm link                          # Register 'babok' command globally (for development)
npm test                          # Smoke test: babok --help
node bin/babok.js --help          # Run without npm link
```

### MCP Server (`babok-mcp/`)

```bash
cd babok-mcp
npm install
npm run dev                       # Watch mode (node --watch bin/babok-mcp.js)
npm test                          # Smoke test (runs src/test/smoke.js)
npm start                         # Production mode
```

### Web UI (`web/`)

```bash
cd web
npm install
npm run dev                       # Development server (http://localhost:3000)
npm run build                     # TypeScript check + production build
npm run lint                      # ESLint check
```

---

## High-Level Architecture

### Four Interfaces, One Storage Layer

BABOK Analyst ships as four independent interfaces that all read/write the same canonical storage:

| Interface | Purpose | Entry Point | Storage Access |
|-----------|---------|------------|-----------------|
| **CLI** | Terminal-based workflows | `cli/bin/bakok.js` | Direct file I/O + journal management |
| **MCP Server** | Model Context Protocol for Claude/GPT | `babok-mcp/src/server.js` | 19 tools + 9 stage resources |
| **Web UI** | Dashboard & project browser | `web/app/` (Next.js App Router) | REST API + server-side readers |
| **Plugin** | VS Code / Claude Code / Copilot integration | `commands/*.md` + `hooks/*.cjs` | Delegates to CLI or MCP |

**Canonical Storage:** `projects/<project_id>/` (not `BABOK_Analysis/`, which is legacy)
- `PROJECT_JOURNAL_<id>.json` — State machine (stage status, approvals, decisions, assumptions)
- `STAGE_0N_<name>.md` — Per-stage deliverable markdown files
- `.stage_N.lock` — File lock for team collaboration (2-hour stale threshold)

### 9-Stage Pipeline

Each stage represents a distinct business analysis deliverable:

| Stage | Deliverable | File |
|-------|------------|------|
| 0 | Project Charter (Go/No-Go gate) | `STAGE_00_Project_Charter.md` |
| 1 | Stakeholder Mapping & Success Criteria | `STAGE_01_Project_Initialization.md` |
| 2 | AS-IS Process Analysis | `STAGE_02_Current_State_Analysis.md` |
| 3 | Problem Domain & Root Cause Analysis | `STAGE_03_Problem_Domain_Analysis.md` |
| 4 | Requirements (FR/NFR, MoSCoW, RTM) | `STAGE_04_Solution_Requirements.md` |
| 5 | TO-BE Design & Future State | `STAGE_05_Future_State_Design.md` |
| 6 | Gap Analysis & Implementation Roadmap | `STAGE_06_Gap_Analysis_Roadmap.md` |
| 7 | Risk Assessment & Mitigation | `STAGE_07_Risk_Assessment.md` |
| 8 | Business Case & ROI Model | `STAGE_08_Business_Case_ROI.md` |

**Stage Lifecycle:** `not_started → in_progress → completed → approved | rejected`

Stages are loaded from `BABOK_AGENT/stages/BABOK_agent_stage_N.md` at runtime — no build step, changes take effect immediately.

### Two-Key Journal: Agent/Human Separation of Duties

Stage approval is enforced **outside the LLM** as a hard gate:

1. **Agent** calls `babok_save_deliverable`, then `babok_submit_for_review` (writes `PROJECT_JOURNAL.json`)
2. **Human** runs `babok approve <id> <stage>` — this is the **only path** that sets `status: approved`
3. **To revise** an approved stage, either side calls `babok_open_revision` first (resets to `in_progress`)

**Enforcement:** `hooks/babok-gate.cjs` (PreToolUse hook)
- Blocks agents from direct `babok_approve_stage` calls
- Blocks `babok_save_deliverable` on approved stages unless `revision_open: true`
- Wired for Claude Code, Codex, and Copilot CLI with host-specific block contracts

### Project ID Format

All projects use unique identifiers: `BABOK-YYYYMMDD-XXXX`
- `YYYYMMDD` — project creation date
- `XXXX` — 4-character random alphanumeric suffix

**Example:** `BABOK-20260702-A3F2`

**Partial ID resolution:** CLI/MCP resolve prefixes automatically (e.g., `BABOK-20260702` resolves to the full ID if unambiguous)

---

## Key Conventions

### ESM Throughout

- All source files are `.js` (no TypeScript in core; React components use `.tsx` in `web/`)
- Root `package.json` and all subpackages use `"type": "module"`
- Import only, no `require()` (except CommonJS hooks, which use `.cjs` extension)

### Language Support

Bilingual throughout (English/Polish):
- CLI commands: `bakok`/`zacznij`/`begin`
- Project context read from `.babok_language` file
- Prompts and templates load per language

### Modular Prompts (No Build Step)

- **Stage instructions:** `BABOK_AGENT/stages/BABOK_agent_stage_N.md` (loaded at runtime)
- **Templates:** `templates/stages/STAGE_0N_*.md` + `templates/modules/` (injected per stage)
- **Knowledge base:** `knowledge/*.json` (industry, regulations, benchmarks, anti-patterns)

Changes to stage files take effect immediately in new projects — no deployment required.

### Project Storage Paths

| Context | Path | Format |
|---------|------|--------|
| CLI + MCP | `projects/<project_id>/` | Canonical; readable by all interfaces |
| Web UI reads | `projects/` or env var `BABOK_PROJECTS_DIR` | Defaults to `./projects` |
| Legacy export | `BABOK_Analysis/` | Only produced by `babok run -o BABOK_Analysis` |
| MCP wiring | `.mcp.json` | Uses `${CLAUDE_PLUGIN_ROOT}` for plugin portability |
| Plugin storage | `~/.claude/plugins/` or equivalent | Host-dependent; plugin hooks auto-install `babok-mcp` |

### Validation & Quality Scoring

**Cross-stage consistency:** `cli/src/validation/rules/` — 6 built-in rules:
1. FR IDs in Stage 4 traceable to RTM
2. Stage 8 budget ≤ Stage 1 ceiling
3. Every system in Stage 2 addressed in Stage 5 TO-BE
4. Every KPI from Stage 1 has Stage 2 baseline
5. Every HIGH/critical risk in Stage 7 has assigned owner
6. Stage 6 go-live date ≥ Stage 1 deadline

**Quality scoring:** `cli/src/quality/scorer.js` — 3 dimensions:
- Completeness (40%): section coverage, required fields present
- SMART criteria (30%): measurable, achievable, time-bound requirements
- Consistency (30%): cross-stage alignment via `validateProject()`

### File Locking for Team Collaboration

- **Lock file:** `.stage_N.lock` in project directory
- **Stale threshold:** 2 hours
- **On stale lock:** CLI shows warning, allows user to override
- **Implementation:** `cli/src/lock.js`

### Multi-Provider LLM Integration

`cli/src/llm.js` supports:
- **Gemini** (Google, via `@google/generative-ai`)
- **OpenAI** (GPT-4, via `openai`)
- **Anthropic** (Claude, via `@anthropic-ai/sdk`)
- **HuggingFace** (via `@huggingface/inference`)
- **Vertex AI** (via `@google-cloud/vertexai`)

Keys encrypted and stored in `.babok_keystore` (XOR cipher with `hostname+username+cwd`) — never committed.

### Document Ingest Pipeline

`babok ingest <file>` supports:
- **PDF:** via `pdf-parse`
- **DOCX:** via `mammoth`
- **XLSX/CSV:** via `exceljs`
- **Markdown/Text:** direct parse

Ingested documents classified and loaded into project context.

---

## Plugin Architecture

The repository distributes as a plugin across three ecosystems:

| Host | Manifest | Installation | Activation |
|------|----------|--------------|------------|
| **Claude Code** | `.claude-plugin/` | Via marketplace | `hooks/babok-activate.cjs` (SessionStart) |
| **Codex** | `.agents/plugins/` (copy of `.claude-plugin/`) | Via CLI: `codex plugin add` | Same hooks |
| **Copilot CLI** | Auto-installed with plugin | Via CLI: `copilot plugin install` | Same hooks |

**Hooks wired for all three:**
- `babok-activate.cjs` (SessionStart) — Run `npm install` in `babok-mcp/`
- `babok-gate.cjs` (PreToolUse) — Enforce Two-Key Journal, file locks
- `babok-quality-gate.cjs` (PostToolUse) — Auto-score submissions, feed issues as context
- `babok-deactivate.cjs` (SessionEnd) — Cleanup state file
- `babok-instructions.cjs` (InstructionCustomization) — Inject operating rules

**Keep in sync:** `npm run sync-codex-plugin` regenerates `.agents/plugins/` from `.claude-plugin/`

---

## Development Patterns

### Adding a New Command

1. Create `cli/src/commands/<cmd>.js` with Commander.js action
2. Export action from `cli/src/commands/index.js`
3. Wire in `cli/bin/babok.js`: `program.command('<cmd>').action(...)`
4. Add test in `tests/integration/cli-workflow.test.js` if user-facing

### Adding a New MCP Tool

1. Define tool schema in `babok-mcp/src/server.js` (Zod + JSON schema)
2. Implement handler in same file (all 19 tools in single `~1800-line file)
3. Add assertion to `babok-mcp/src/test/smoke.js`
4. Run `npm test` at root; MCP tests included

### Adding a New Stage

1. Create `BABOK_AGENT/stages/BABOK_agent_stage_N.md` with process, questions, template
2. Create `templates/stages/STAGE_0N_*.md` skeleton
3. Update `agent_config.json` with stage config (model, retries, etc.)
4. Add validation rules in `cli/src/validation/rules/` if needed
5. Update version in `VERSION` file and all `package.json` files
6. Run `npm run check-versions` to verify sync

### Modifying the Journal Schema

- Schema lives in `cli/src/journal.js` (no separate schema file)
- Update both journal creation and migration logic
- Add test case to `tests/unit/journal.test.js`
- Run full test suite: `npm test`

---

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `BABOK_PROJECTS_DIR` | Override default project storage path | `./projects` |
| `BABOK_AGENT_DIR` | Override stage files location | `./BABOK_AGENT` |
| `BABOK_LANGUAGE` | Override language (EN/PL) | EN |
| `GEMINI_API_KEY`, `OPENAI_API_KEY`, etc. | LLM credentials | Read from `.babok_keystore` |
| `CLAUDE_PLUGIN_ROOT` | Plugin marketplace portability | Set by plugin host |

---

## Testing Strategy

- **Unit tests:** `tests/unit/*.test.js` — journal, project ID, scoring, validation, templates
- **Integration tests:** `tests/integration/*.test.js` — full CLI workflows (create project, add stages, etc.)
- **Plugin tests:** `tests/*.test.cjs` — plugin manifest, hooks, uninstall cleanup
- **Smoke tests:** `babok-mcp/src/test/smoke.js` — MCP tool connectivity

**Run targeted tests:**
```bash
node --test tests/unit/journal.test.js
node --test tests/unit/two-key-gate.test.js
npm test --grep "scoring"  # Not yet supported; use node --test with full filename
```

---

## Common Tasks

### Debug a Stage Generation

1. Start CLI chat: `babok chat <project_id>`
2. Manually invoke stage prompt (copy from `BABOK_AGENT/stages/STAGE_0N.md`)
3. Check `PROJECT_JOURNAL_<id>.json` for submission/approval state
4. Verify `.stage_N.lock` is not stale: `cat .stage_N.lock`

### Check Project State

```bash
cat projects/<project_id>/PROJECT_JOURNAL_*.json | jq '.stages[] | {stage, status}'
```

### Force a Stage Back to Draft

```bash
babok open revision <project_id> <stage_number>
```

### Export All Stages to Markdown

```bash
babok export <project_id>
```

### Generate DOCX/PDF from Stages

```bash
babok make docx <project_id>
babok make pdf <project_id>
babok make all <project_id>  # Generates both formats + bundle
```

### Run Autonomous Pipeline

```bash
babok run --auto --diagram --context my_context.json
```

Generates all 8 stages with quality checks (up to 3 iterations per stage) before final human approval.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Full architecture docs (for Claude Code; includes MCP design, hooks, etc.) |
| `AGENTS.md` | Always-on agent rules (generic, non-host-specific) |
| `docs/L2_L3_ARCHITECTURE.md` | Agent orchestration layer design |
| `docs/agent-portability.md` | Plugin adapter matrix (Claude Code / Codex / Copilot CLI) |
| `cli/src/journal.js` | Project state management (core) |
| `cli/src/project.js` | Project ID generation & resolution |
| `cli/src/quality/scorer.js` | Quality scoring engine |
| `cli/src/validation/cross-stage-validator.js` | Cross-stage consistency checks |
| `babok-mcp/src/server.js` | MCP server (all 19 tools + 9 resources in one file) |
| `hooks/babok-gate.cjs` | Two-Key Journal enforcement (critical) |
| `web/app/` | Next.js dashboard (App Router + API routes) |

---

## Gotchas

1. **ESM only** — No `require()` in `.js` files (use `.cjs` for CommonJS hooks)
2. **Node 18+ required** — ESM without `--experimental-` flags only in 18+
3. **Hooks are CommonJS** — `hooks/*.cjs` must work with all CLI platforms (Windows, macOS, Linux)
4. **Two-Key Journal enforced outside LLM** — `babok-gate.cjs` is the enforcement point; prompt instructions alone don't prevent agent approval
5. **Stage prompts load at runtime** — Changes to `BABOK_AGENT/stages/` take effect immediately; no rebuild needed
6. **Project ID prefix resolution** — `babok chat BABOK-20260702` resolves to `BABOK-20260702-A3F2` if unambiguous; fails if multiple projects match
7. **MCP wiring uses `${CLAUDE_PLUGIN_ROOT}`** — `.mcp.json` must resolve correctly in all plugin hosts; test in Claude Code, Codex, and Copilot CLI

---

## For Agent Developers

If using Copilot/Claude to work on this repo:

- **Two-Key Journal workflow:** Always call `babok_submit_for_review` after `babok_save_deliverable`. Never bypass the human approval gate in `babok-gate.cjs`.
- **Test all interfaces:** Changes to storage layer must work via CLI, MCP, Web UI, and plugin simultaneously.
- **Version sync:** After bumping version, run `npm run check-versions` to verify all `package.json` files match.
- **Plugin wiring:** If adding new env vars or hooks, update `.mcp.json` and all three manifests (`.claude-plugin/`, `.agents/plugins/`, Copilot equivalent).
- **Prompt file stability:** `BABOK_AGENT/stages/BABOK_agent_stage_N.md` are core — document changes in `CHANGELOG.md` and `VERSION` file.
