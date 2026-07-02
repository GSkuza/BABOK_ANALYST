# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BABOK Analyst is an AI-powered business analysis platform implementing the BABOK v3 framework as a structured 9-stage pipeline (Stage 0 charter gate + Stages 1–8). It ships four interfaces that share the same file-system storage layer: a Node.js CLI, an MCP server, a Next.js web UI, and a Claude Code / Codex / Copilot CLI plugin.

**Version**: 2.2.8 | **Node.js**: 18+ required | **Module system**: ESM (`"type": "module"` in root and package-level `package.json`)

---

## Commands

### Root test suite (plugin-level tests)
```bash
npm install
npm test                          # all root tests: unit + integration + plugin/hook/uninstall tests
npm run check-versions            # verify version numbers are in sync across package.json files
npm run sync-codex-plugin         # regenerate .codex-plugin from .claude-plugin

# Run a single root test file
node --test tests/unit/journal.test.js
node --test tests/unit/two-key-gate.test.js
node --test tests/plugin-manifest.test.cjs
```

### CLI (`cli/`)
```bash
cd cli
npm install
npm link                          # register 'babok' globally
node bin/babok.js --help          # run without linking
npm test                          # smoke test only (runs `babok --help`)
```

### MCP Server (`babok-mcp/`)
```bash
cd babok-mcp
npm install
npm run dev       # watch mode (node --watch)
npm test          # smoke test: node src/test/smoke.js
npm start         # production
```

### Web UI (`web/`)
```bash
cd web
npm install
npm run dev       # http://localhost:3000
npm run build
npm run lint      # ESLint
```

### CLI commands (once linked, see full list in `README.md`)
```bash
babok new [--name "Name"]         # create a project
babok chat <id>                   # interactive AI chat for the current stage
babok run [--context file.json]   # autonomous pipeline through all 8 stages (--auto, --diagram)
babok score <id> <stage|all>      # quality scoring (3 dimensions)
babok validate <id>               # cross-stage consistency (exits 1 on errors)
babok ingest <file>               # ingest PDF/DOCX/XLSX/CSV/TXT/MD
babok approve <id> <stage>        # human attestation — the only way to approve a stage
babok diff <id> [id2] [--stage N] # stage history, or LCS diff between two projects
babok make docx|pdf|all <id>      # generate documents from stage files
```

---

## Architecture

### Storage layer (shared by all interfaces)
All state lives under `projects/<project_id>/` (canonical — used by MCP, CLI, and plugin installs). `BABOK_Analysis/` is a legacy path, only produced by `babok run -o BABOK_Analysis`.
- `PROJECT_JOURNAL_<id>.json` — authoritative state machine (stage status, timestamps, decisions, assumptions, open questions, agent submissions, human attestations)
- `STAGE_0N_<name>.md` — per-stage deliverable markdown files
- `.stage_N.lock` — file lock for team collaboration (stale threshold: 2 hours)

**Project ID format**: `BABOK-YYYYMMDD-XXXX` (e.g. `BABOK-20260401-A3F2`). Partial IDs resolve by prefix matching in `cli/src/project.js`.

**Stage lifecycle**: `not_started → in_progress → completed → approved | rejected`

### Two-Key Journal (agent/human separation of duties)
Stage approval is a hard gate enforced outside the LLM's control, not just a prompt instruction:
1. Agent calls `babok_save_deliverable`, then `babok_submit_for_review` (`cli/src/journal.js`).
2. Human runs `babok approve <id> <stage>` — this is the only path that sets `status: approved`.
3. To edit an already-approved stage, either side must call `babok_open_revision` first, which flips `revision_open: true` and resets `status` to `in_progress`.
4. `hooks/babok-gate.cjs` is a PreToolUse/`preToolUse` hook that blocks agents from calling `babok_approve_stage` directly, and blocks `babok_save_deliverable` on an approved stage unless `revision_open` is set. This is the enforcement point — do not bypass it when adding new tools or write paths. Wired for Claude Code, Codex, and Copilot CLI. Copilot's block contract differs from Claude/Codex's exit-code-2 convention: Copilot ignores exit 2 and instead requires stdout JSON `{ permissionDecision: "deny", permissionDecisionReason }`, while any *other* non-zero exit fail-closes (denies) by default there — so every code path in the hook must end in an explicit `process.exit(0)` or the `deny()` helper, never an uncaught throw.

### 9-Stage pipeline
Each stage maps to a prompt file in `BABOK_AGENT/stages/BABOK_agent_stage_N.md` (loaded at runtime — changes take effect immediately, no build step):

| Stage | Deliverable |
|-------|-------------|
| 0 | Project Charter (Go/No-Go gate) |
| 1 | Stakeholder Mapping & Success Criteria |
| 2 | AS-IS Analysis |
| 3 | Problem Domain & Root Cause |
| 4 | Requirements (FR/NFR, MoSCoW, RTM) |
| 5 | TO-BE Design |
| 6 | Gap Analysis & Roadmap |
| 7 | Risk Register |
| 8 | Business Case & ROI |

### Autonomous pipeline (`babok run`)
`cli/src/commands/run.js` drives the full Stage 1→8 pipeline without per-stage manual chat, built on `cli/src/orchestrator/`:
- `engine.js` — sequences stages per `agent_config.json`'s `orchestrator.pipeline`, running Stage 2 and Stage 7's initial risk scan in parallel via `parallel-runner.js`
- `quality-loop.js` — after each stage, scores the deliverable and re-prompts up to 3 iterations before escalating to the human (mirrors the Two-Key gate — never auto-approves)
- `context-manager.js` — reads/writes the shared `my_project_context.json` state across stages

Two reasoning techniques from `cli/src/reasoning/` are layered on top: `debate.js` (Analyst → Critic → Synthesiser pass, stages 3/4/6/8 only) and `verify.js` (Chain-of-Verification: generate check questions, answer CONFIRMED/UNCERTAIN/REFUTED, correct if needed — writes `STAGE_NN_verification.json`). `process-mapper.js` generates Mermaid diagrams for `--diagram`.

`message-bus.js` (append-only `agent_messages.jsonl` event log + `EventEmitter` pub/sub), `stage-executor.js`, and `stage-worker.js` (optional `worker_threads` isolation) are early scaffolding toward message-passing between independent stage-processes and per-task-type LLM provider routing — not yet wired into `babok run`. See `docs/AGENT_MESSAGING_AND_PROVIDER_ROUTING_PLAN.md` for the design.

Full design/roadmap (partly aspirational): `docs/L2_L3_ARCHITECTURE.md`.

### Templates & knowledge base
- `templates/` — stage-first deliverable skeletons (`templates/stages/STAGE_0N_*.md`) plus reusable `modules/` (RTM, DPIA, User Story) and `industry/` supplements, wired via `manifest.json` and injected by `cli/src/templates.js` (CLI) or the `babok_get_stage_template` MCP tool (agents must call this before `babok_save_deliverable` to preserve required H2 headings).
- `knowledge/` — static industry/regulation/benchmark/anti-pattern JSON reference data (manufacturing, distribution, services; GDPR, ISO 27001, KSeF, XRechnung), loaded via `cli/src/lib/knowledge-loader.js` and injected into prompts.

### Key source files

| File | Role |
|------|------|
| `cli/bin/babok.js` | Commander.js entry point; routes commands to `cli/src/commands/*.js` |
| `cli/src/journal.js` | Journal CRUD, stage transitions, Two-Key Journal guard functions |
| `cli/src/project.js` | Project ID generation & path resolution |
| `cli/src/llm.js` | Multi-provider LLM client (Gemini, OpenAI, Anthropic, HuggingFace, Vertex AI) with encrypted key storage |
| `cli/src/lock.js` | File locking for concurrent team access |
| `cli/src/quality/scorer.js` | Quality scoring: Completeness 40%, SMART 30%, Consistency 30% |
| `cli/src/validation/cross-stage-validator.js` | Runs all rules in `cli/src/validation/rules/` against a project |
| `cli/src/orchestrator/engine.js` | `babok run` pipeline sequencing, parallel groups, quality-loop invocation |
| `babok-mcp/src/server.js` | MCP server: 19 tools + 9 stage resources (single ~1800-line file) |
| `hooks/babok-gate.cjs` | PreToolUse: Two-Key Journal enforcement + `.stage_N.lock` check on `babok_save_deliverable` |
| `hooks/babok-quality-gate.cjs` | PostToolUse/`postToolUse` on `babok_submit_for_review`: runs `scorer.js` + `cross-stage-validator.js`, feeds issues back as `additionalContext` (never blocks). Wired for Claude Code, Codex, and Copilot CLI — Copilot uses a flat `{ additionalContext }` payload and `toolName`/`toolArgs` field names instead of the nested `hookSpecificOutput` shape; the hook detects the host via `isCopilot` from `babok-runtime.cjs` |
| `hooks/babok-deactivate.cjs` | SessionEnd/`sessionEnd`: clears the `.babok-analyst-active` state file. Wired for Claude Code, Codex, and Copilot CLI (Copilot's `sessionEnd` is notification-only — no output, exit code ignored) |
| `BABOK_AGENT/BABOK_Agent_System_Prompt.md` | Core agent system prompt (modular, references stage files) |
| `AGENTS.md` | Always-on rules for generic (non-Claude-specific) agents |

### Cross-cutting concerns

**LLM / API keys**: Hierarchy is `env var → .env → .babok_keystore` (XOR-encrypted with `hostname+username+cwd` as key). Never commit `.env` or `.babok_keystore`.

**Language**: EN/PL bilingual throughout. Language stored in `.babok_language`, read by `cli/src/language.js`. All CLI output, prompts, and UI respect this. `begin` and `zacznij` are equivalent CLI binary aliases (English/Polish).

**MCP wiring**: `.mcp.json` at root uses `${CLAUDE_PLUGIN_ROOT}` variables for plugin-marketplace portability. Env vars `BABOK_PROJECTS_DIR` and `BABOK_AGENT_DIR` override default paths.

### Validation rules (cross-stage-validator, `cli/src/validation/rules/`)
1. FR IDs in Stage 4 appear in RTM (`rule-fr-traceability.js`)
2. Stage 8 budget ≤ Stage 1 ceiling (`rule-budget-ceiling.js`)
3. Every system from Stage 2 addressed in Stage 5 TO-BE (`rule-integration-coverage.js`)
4. Every KPI from Stage 1 has a Stage 2 baseline (`rule-kpi-coverage.js`)
5. Every HIGH/critical risk in Stage 7 has an assigned owner (`rule-critical-risk-owner.js`)
6. Stage 6 go-live date does not precede Stage 1 deadline (`rule-roadmap-date.js`)

---

## Plugin integration

This repo is distributed as a plugin across three agent ecosystems. Plugin artifacts:
- `agents/*.md` — orchestrator, per-stage (0–8), knowledge-expert, and quality-audit subagent definitions
- `commands/*.md + *.toml` — `/babok-new`, `/babok-new-pl`, `/babok-new-eng`, `/babok-status`, `/babok-help`
- `hooks/*.cjs` — lifecycle hooks: `babok-activate`/`babok-deactivate` (SessionStart/SessionEnd), `babok-config` (shared path resolution), `babok-gate` (PreToolUse Two-Key + lock enforcement), `babok-quality-gate` (PostToolUse auto-scoring), `babok-instructions`, `babok-mcp-launcher`, `babok-runtime`
- `.claude-plugin/`, `.codex-plugin/` — marketplace manifests (keep in sync via `npm run sync-codex-plugin`)
- `.github/copilot-instructions.md` — Copilot Chat system prompt (~1600 lines) — authoritative source for VS Code/Copilot behavior
- `.github/prompts/*.prompt.md` — per-stage Copilot Chat prompt files
- `.github/workflows/lint-prompts.yml` — CI validates stage instruction files on every push
- `scripts/check-versions.cjs` — verifies version numbers match across all `package.json`/manifest files
- `scripts/uninstall.cjs` — removes plugin-installed external state

Install:
```
/plugin marketplace add GSkuza/BABOK_ANALYST
/plugin install babok_analyst@babok_analyst
/reload-plugins
```

See `docs/agent-portability.md` for the full Claude Code / Codex / Copilot CLI adapter matrix.

---

## Debugging

- **Stale lock**: delete `projects/<id>/.stage_N.lock` if older than 2h
- **API key issues**: run `babok setup` to re-enter keys
- **MCP not connecting**: verify `BABOK_PROJECTS_DIR` and `BABOK_AGENT_DIR` env vars in MCP config
- **Stage prompts not updating**: confirm `BABOK_AGENT/stages/` path is correct — loaded at runtime, no cache
- **"stage is approved and locked" error on save**: call `babok_open_revision` before `babok_save_deliverable`, or use `babok approve` semantics correctly — this is the Two-Key Gate hook (`hooks/babok-gate.cjs`), not a bug
