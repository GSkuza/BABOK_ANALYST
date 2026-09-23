# Changelog

All notable changes to BABOK Analyst project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Web AI settings — available models and advanced model routing** (`/settings/ai`): lists the models every configured API key can access (live discovery for OpenAI, Anthropic and now Gemini; registry lists otherwise) and routes stage interviews/draft generation per pipeline profile (IT/BABOK, consulting, software development) and per stage, with `temperature` and reasoning `effort` at every level, ordered fallback chains, and optional failover across every configured API key. New `cli/src/model-routing.js` (stored in gitignored `.babok_model_routing.json`), `createLlmClient(provider, key, model, { temperature, effort })` with automatic retry without parameters a model rejects, and `/api/settings/ai/models` + `/api/settings/ai/routing` routes.
- **Advanced model routing in the CLI and MCP**: the same `.babok_model_routing.json` now drives `babok run` (normal, `--auto`, `--orchestrate`, incl. the stage worker), `babok chat` (per current stage, re-applied after `/stage N`) and `babok sd` autonomous stages. Each stage uses its own provider/model, temperature and effort, and fails over across every configured API key. It never replays requests that were cancelled, timed out or already streamed output. Explicit `--provider/--model/--deep-model` flags win, and `--no-routing` ignores the file. New `babok routing show|resolve|set|unset|failover|reset` command; new `cli/src/routed-llm.js` failover client (also used by the web stage runner). `cli/src/model-routing.js` is now dependency-free and mirrored in `babok-mcp/src/lib/model-routing.js`. MCP: `babok_get_stage` appends a *Model Route* section, plus new tools `babok_get_model_routing`, `babok_resolve_model_route` and `babok_set_model_routing_rule`. Covered by `tests/unit/routed-llm.test.js`.
- **Autonomous Stage 3 (Options & Architecture Decisions) — now implemented and live-verified with a real LLM key**: `cli/src/software-development/options-recommender.js` (mirrored in `babok-mcp`) requires an `llmClient` (unlike Stage 1, option generation cannot be done mechanically) and runs the profile's two-call design: a draft call (reuse check, options incl. an explicit `OPT-00` do-nothing baseline, weighted evaluation, recommendation, ADRs, compatibility/migration) followed by an **independent critique call** against the same evidence, whose correction (if any) always replaces the draft. **Live-verified** end-to-end against the OpenAI key configured via Web AI Settings (`tests/unit/software-development-options.test.js`): a real two-call round trip producing ≥ 2 options plus `OPT-00`, at least one ADR, and evaluation weights summing to ~100.
- **Baseline narrative synthesis — now live-verified**: `baseline-builder.js`'s optional LLM pass (previously mock-tested only) was exercised for real against `GSkuza/BABOK_ANALYST`'s actual evidence, producing a narrative that demonstrably cites real `EV-NNN` ids from that run.
- **CLI**: `babok sd baseline build` now auto-detects any already-configured LLM provider (env var, `babok setup`, or the Web AI Settings page — same encrypted keystore) and adds narrative synthesis automatically; falls back to the existing mechanical-only baseline with an explicit note when none is configured. No new flag needed.
- **Software-development runtime, autonomous baseline, and CLI/MCP surfaces** — the profile now does real work, not just data/contracts:
  - `cli/src/software-development/repository-analyzer.js`: mechanical (LLM-independent), evidence-backed repository analysis — manifests (deep-parsed for npm/Go/Cargo, presence-only for others), CI/CD config detection, test-directory detection, every finding cited as an `EV-NNN`. **Live-verified** against the real `GSkuza/BABOK_ANALYST` repository (root `package.json` actually parsed, real CI workflows and `tests/` detected).
  - `cli/src/software-development/baseline-builder.js`: orchestrates the analyzer across every repository in a product and persists a new immutable baseline via `product-store.js`; adds LLM narrative synthesis only when a client is supplied — the mechanical evidence alone is already a valid baseline.
  - `cli/src/software-development/runtime/{task-store,api-executor,host-task}.js`: the shared TaskRequest/TaskResult runtime for **both** required executors — `api-executor.js` fulfils a task with this process's own logic (e.g. `runBaselineTask`), `host-task.js` is the handoff an active plugin host (Copilot CLI, Claude Code, Codex) claims via MCP and reports back through — same contract either way, with a lease so two executors cannot double-claim one task.
  - `cli/src/software-development/runtime/{execution-authorization,code-executor}.js`: the Stage 4 "Execution Authorisation Status" made real — a distinct, explicit, per-initiative, per-scope grant (`run_tests`/`publish_branch`) with a command/directory whitelist, checked before `code-executor.js` runs anything. **Real-process-verified**: a genuine local sandbox git repository, a genuine `node` subprocess, real exit codes (0 and a deliberate 7), and a real "command not found" spawn failure — never a fabricated success.
  - `cli/src/software-development/outcomes/{deployment-record,kpi-tracker}.js`: Stage 6 evidence — keeps "merged", "released" and "deployed" distinct (a GitHub release is never treated as proof of deployment) and evaluates KPI readings from JSON/CSV with an honest "pending" when no reading falls in the measurement window. **Live-verified** against `GSkuza/BABOK_ANALYST`'s real releases/deployments.
  - `hosting/github.js` gained `listReleases`/`listDeployments` for the above.
  - **CLI**: `babok sd product create|list|show|add-repo`, `babok sd baseline build|list|show`, `babok sd exec authorize|show|run` — verified end-to-end against the real repository and a real sandbox execution.
  - **MCP**: 10 new tools (`sd_create_product`, `sd_list_products`, `sd_get_product`, `sd_build_baseline`, `sd_get_baseline`, `sd_authorize_execution`, `sd_get_execution_authorization`, `sd_list_pending_host_tasks`, `sd_claim_host_task`, `sd_submit_host_task_result`) — **verified live** with a real MCP client (`@modelcontextprotocol/sdk`) over stdio against the running server, exercising `sd_create_product` → `sd_build_baseline` → `sd_authorize_execution` end-to-end.
  - All new library modules are mirrored byte-for-byte in `babok-mcp/src/lib/software-development/` (`tests/unit/lib-parity.test.js`, now 20 mirrored pairs). 106 new tests across `tests/unit/software-development-{baseline,runtime,execution,outcomes}.test.js` (328 total root tests, all passing).
  - **Known gap, not yet implemented**: publishing a branch/PR/MR to a real remote. The GitHub/GitLab connectors remain read-only by design (see their file headers) — writing is deliberately deferred pending a separately-confirmed target repository, consistent with the profile's execution-authorisation guardrail.
  - **GitLab note**: a `GITLAB_TOKEN` (`glpat-...` format) was present in this environment but returned 401 against `gitlab.com`'s API — likely scoped to a self-hosted instance whose URL was not available. `hosting/gitlab.js` therefore remains mock-tested only.
- **GitHub/GitLab read connectors** (`cli/src/software-development/hosting/{github,gitlab}.js`, mirrored in `babok-mcp`): a shared, cross-platform shape (`getRepository`, `resolveCommit`, `getTree`, `getFileContent`, `listPullRequests`, `listIssues`, plus `listWorkflowRuns`/`listPipelines`) so later stages don't need to know which host a repository lives on. GitHub shells out to the already-authenticated `gh` CLI and every method is **live-verified** in this session's test run against the public `GSkuza/BABOK_ANALYST` repository (`tests/unit/software-development-github.test.js` — 7 real, network-backed tests, self-skipping when `gh` isn't authenticated). GitLab talks to the REST v4 API directly over `fetch` with a configurable `baseUrl`/token; **no GitLab credentials were available in this session**, so its suite (`tests/unit/software-development-gitlab.test.js`) validates against documented response shapes only and is explicitly marked reviewed-but-unverified until run once against a real GitLab project. Both surface distinct `GithubApiError`/`GitlabApiError` types with a normalised `status`/`code` (`not_found`/`forbidden`/`unauthorized`/`network_error`/`unknown`) instead of ever returning an empty result on failure.
- **Software-development data contracts & durable storage:** `cli/src/software-development/schemas.js` (hand-rolled validators — no new dependency — for `Product`, `RepositoryRef`, a repository snapshot within a baseline, `EvidenceEntry` (`EV-NNN`), `TaskRequest`/`TaskResult`) and `cli/src/software-development/product-store.js` (atomic-write JSON storage under `projects/.products/<product_id>/`, invisible to `listProjectIds()`; immutable `baselines/<baseline_id>/manifest.json` — refreshing a baseline always allocates a new id rather than mutating the old one). Both mirrored byte-for-byte in `babok-mcp/src/lib/software-development/` (`tests/unit/lib-parity.test.js`). Covered by `tests/unit/software-development-storage.test.js` (28 tests).
- **Software-development profile** (`profiles/software-development/`, prefix `SD-`, stages 0–6): Change Charter → Product & Repository Baseline → Change Impact & Gap Analysis → Options & Architecture Decisions → Implementation & Verification Plan → Release & Operational Readiness → Outcome & Context Reconciliation. Plans modernisation/new-feature work against an **existing** product and its connected repositories. Stages 1 and 3 are performed autonomously from repository/product evidence — no technical interview — with every claim expected to cite an `EV-NNN` source or be labelled `Assumption`/`Hypothesis`. Own system prompt, stage prompts, templates + `ADR_Template.md` module, quality rubric (reusing `KPI-COVERAGE`, `INTEGRATION-COVERAGE`, `BUDGET-CEILING`, `ROADMAP-DATE`, `FR-TRACEABILITY`, `CRITICAL-RISK-OWNER` with software-development bindings), quality-audit prompt, stage configs, orchestrator config and example project context.
- **Profile schema:** optional `orchestrator.autoApproveGeneratedStages` (default `true`, preserving existing behaviour). The software-development profile sets it `false` so a stage produced by `babok run` (with or without `--orchestrate`) is always recorded as an `agent_submission` awaiting a human `babok approve`, never written directly as `status:approved`/`approved_by:auto-run` — the Two-Key Journal gate is never bypassed for this profile, including via the autonomous pipeline.
- **Plugin:** `/babok-new-software-development [PL|ENG]` command.
- **Web:** `software-development` option on the `/projects/new` profile selector.
- **Docs:** `README.md`, `CLAUDE.md`, `AGENTS.md` and `.github/copilot-instructions.md` document the third profile, its `SD-` prefix and the execution-authorisation boundary (plan approval is distinct from authorising code execution, merge or deployment).

### Changed
- **BABOK_Agent_LLM_Prompt.md (v2.3.0):** Synchronized with stage-first `templates/` architecture — deliverable skeletons, `babok_get_stage_template`, Two-Key Journal workflow, industry packs, project context schema, and chat-only H2 fallback from quality rubric.

## [2.3.0] - 2026-09-03

### Added
- **Pipeline profiles:** `profiles/<id>/profile.json` (schema `profiles/profile.schema.json`) declares stage shape, project-ID prefix, prompt/template/rubric paths, validation-rule bindings and the autonomous pipeline. `profiles/babok/` describes the existing 9-stage pipeline without moving any file.
- **Consulting profile** (`profiles/consulting/`, prefix `BC-`, stages 0–6): Engagement Charter → Stakeholder & Governance → Current State Diagnostic & Root Cause → Strategic Options → Target Operating Model & Roadmap → Risk & Change Readiness → Business Case & Value Realization. Own stage prompts, templates + modules (Options Evaluation Matrix, Operating Model Canvas, Fishbone, Change Readiness, Benefits Tracker, RACI/Governance), rubric, quality-audit prompt, stage configs, example context. No software requirements / system design by mandate.
- **CLI:** `babok new --profile <id>`, `babok run --profile <id>`; `babok list` shows profile and profile-aware stage totals; `babok status` shows stage names.
- **MCP:** `babok_new_project` accepts `profile`; every tool resolves stage names, files, prompts, rubric and templates from the project's profile; resources `babok://profiles/<id>/stages/<n>` for non-default profiles; `babok_get_stage_template` accepts `profile` when no project is given.
- **Validation:** rules accept stage bindings (`check(artifacts, bindings)`); `RULE_REGISTRY` + `rulesForProfile()`; new rule `RECOMMENDATION-TRACEABILITY` (OPT-NN from the options stage must appear in the target-operating-model stage).
- **Knowledge:** `knowledge/frameworks/` (7S, Kotter, ADKAR, DMAIC, Balanced Scorecard, Value Chain) and `knowledge/change_management/` (readiness benchmarks, resistance patterns) with schemas; `getRelevantKnowledge(ctx, profile)` loads profile-declared extra categories.
- **Plugin:** `/babok-new-consulting` command; profile section in `skills/babok-analyst/SKILL.md`.
- **Web:** profile selector on `/projects/new`; project store honours `BABOK_PROJECTS_DIR`, recognises every profile prefix and shows journal stage names.
- **Tests:** `profiles.test.js` (profile integrity incl. template↔rubric alignment), `lib-parity.test.js` (cli ↔ babok-mcp shared libs must be byte-identical), `engine.test.js` (pipeline order per profile), `knowledge-loader.test.js`; hooks test covers `BC-` projects.

### Changed
- `journal.profile` is written on creation and normalised to `babok` for legacy journals.
- Scorer reads the rubric from the profile; `consistency.js` selects built-in checks via rubric key `builtin_consistency` instead of `switch(stageNumber)`.
- Orchestrator engine executes `profile.orchestrator.pipeline` (sequential/parallel groups) instead of a hard-coded sequence; `stopAfterStage` now skips every stage above the limit, including parallel scans.
- `two-key-gate.js` is identical in `cli/` and `babok-mcp/` (host-neutral lock message).
- Project-ID matching is prefix-based across CLI, MCP, hooks and web (`<PREFIX>-…`), covering title-slug IDs from `babok run`.
- `cli/scripts/lint-stages.js` lints every profile's prompt files; `sync-codex-plugin` also copies `profiles/` and `templates/`.

### Fixed
- `babok validate` was never registered as a command (missing `.command('validate <id>')`).
- `babok new --non-interactive` (used by the web API) is now accepted.

## [2.2.8] - 2026-06-25

### Added
- **Two-Key Journal:** `agent_submission` + `human_attestation` with matching `content_sha256` required before `approved`.
- **MCP tools:** `babok_submit_for_review` (agent key 1), `babok_open_revision` (unlock approved stage).
- **CLI:** `babok open-revision <id> <stage>`; `babok approve` records human attestation from on-disk deliverable hash.
- **PreToolUse hook:** `hooks/babok-gate.cjs` blocks agent `babok_approve_stage` and `babok_save_deliverable` on locked approved stages.

### Changed
- **`approveStage()`** atomically validates both SHA-256 keys and `spot_check_passed` before advancing pipeline.
- **`babok_save_deliverable`** clears pending two-key state and refuses writes on approved stages unless `revision_open`.

## [2.2.7] - 2026-06-25

### Added
- **awesome-codex-plugins readiness:** `SECURITY.md`, `.codexignore`, `assets/icon.svg`, and `interface.composerIcon` in Codex manifest.
- **CI:** `.github/workflows/hol-plugin-scanner.yml` (HOL AI Plugin Scanner gate, score ≥ 80).
- **Dependabot:** `.github/dependabot.yml` for GitHub Actions and npm manifests.
- **Root lockfile:** `package-lock.json` for reproducible workspace installs.

### Changed
- **GitHub Actions:** SHA-pinned `actions/checkout` and `actions/setup-node` in `lint-prompts.yml`.
- **Codex bundle sync:** `scripts/sync-codex-plugin.cjs` now copies `assets/`, `SECURITY.md`, and `.codexignore`.

## [2.2.6] - 2026-06-24

### Changed
- **BABOK_Agent_LLM_Prompt.md:** Rewritten for v2.2.6 — 9-stage pipeline (Stage 0 gate), 16 MCP tools, plugin marketplace, slash commands with PL/ENG, CLI highlights, Short Rationale + Evidence, and current project storage model.

## [2.2.5] - 2026-06-24

### Added
- **Slash commands — project language:** `/babok-new` asks for PL vs ENG when no argument is given; `/babok-new PL`, `/babok-new ENG`, `/babok-new-pl`, and `/babok-new-eng` start Stage 0 in the chosen language.
- **Docs:** Updated `SKILL.md`, `AGENTS.md`, `babok-help`, and README command table.

## [2.2.4] - 2026-06-24

### Fixed
- **Codex MCP handshake:** Replaced `${CLAUDE_PLUGIN_ROOT}` paths in `.mcp.json` with `cwd: "."` and `hooks/babok-mcp-launcher.cjs` — Codex does not interpolate Claude plugin variables.
- **MCP dependencies:** Launcher runs `npm install` in `babok-mcp/` on first start when `node_modules` is missing.
- **Projects path:** Launcher and `babok-mcp` resolve workspace `projects/` via `CODEX_WORKSPACE_ROOT` or upward directory search.

## [2.2.3] - 2026-06-24

### Changed
- **Version bump:** All packages and plugin manifests synchronized to `2.2.3`.

## [2.2.2] - 2026-06-24

### Fixed
- **Codex marketplace:** Added `.agents/plugins/marketplace.json` and materialized plugin bundle at `plugins/babok_analyst/` — Codex rejects empty local source path `./` and could not discover plugins from repo root alone.
- **Codex install docs:** Marketplace add must run in a normal terminal (outside Codex sandbox) to write under `~/.codex`.

### Added
- **`scripts/sync-codex-plugin.cjs`:** Keeps `plugins/babok_analyst/` in sync with the portable plugin surface at repo root.

## [2.2.1] - 2026-06-24

### Changed
- **README.md:** Expanded plugin marketplace install guide (v2.2+), component table, troubleshooting matrix (`marketplace not found`, `agents: Invalid input`, MCP cache), release badge, version footer updated.

## [2.2.0] - 2026-06-24

### Fixed
- **Claude Code plugin install:** Removed invalid `agents`/`commands`/`skills`/`mcpServers` string paths from `.claude-plugin/plugin.json` — Claude Code validates these as arrays only; components now auto-discover from standard directories (matches official Anthropic plugins).
- **Claude slash commands:** Added `commands/babok-new.md`, `babok-status.md`, `babok-help.md` (Claude requires `.md`; `.toml` kept for Copilot/Codex).

### Changed
- **Install docs:** Marketplace slug corrected to `GSkuza/BABOK_ANALYST` with troubleshooting for `marketplace not found` error.
- **Version bump:** All packages and plugin manifests synchronized to `2.2.0`.

## [2.1.1] - 2026-04-13

### Added
- **Per-stage LLM routing in orchestrator pipeline:** Stages 3, 4, 6, and 8 (Deep Analysis) can now use a separate, more capable model while lighter stages (1, 2, 5, 7) use the default model.
  - New `createLlmClient(provider, apiKey, modelName)` factory in `cli/src/llm.js` — stateless, reusable, no global state side effects.
  - `cli/src/orchestrator/engine.js`: `DEEP_ANALYSIS_STAGES = {3, 4, 6, 8}` constant; `runPipeline()` accepts new `deepAnalysisClient` option and routes accordingly; progress events include `mode: 'deep_analysis' | 'standard'`.
  - `cli/src/commands/run.js`: `--orchestrate` path initializes both `llmClient` and `deepAnalysisClient` with full provider selection.
  - New **`--deep-model <name>`** CLI flag on `babok run` — specifies model for deep-analysis stages (falls back to `--model` when omitted).

### Usage
```bash
# Gemini Flash for stages 1,2,5,7 + Gemini Pro for stages 3,4,6,8
babok run --orchestrate --provider gemini --model gemini-2.0-flash --deep-model gemini-1.5-pro

# OpenAI: gpt-4o-mini standard, o3 for deep analysis
babok run --orchestrate --provider openai --model gpt-4o-mini --deep-model o3
```

## [2.1.0] - 2026-04-13

### Added

#### 🔌 Plugin Marketplace Distribution — Claude / Codex / Copilot CLI
- **Marketplace manifests:** `.claude-plugin/marketplace.json`, `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, `.github/plugin/plugin.json`, `gemini-extension.json`.
- **Portable MCP wiring:** `.mcp.json` with `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PROJECT_DIR}/projects`.
- **Lifecycle hooks:** `hooks/babok-activate.cjs`, `claude-codex-hooks.json`, `copilot-hooks.json` — session activation + auto `npm install` for `babok-mcp`.
- **Bundled skills:** `skills/babok-analyst/SKILL.md`.
- **Slash commands:** `/babok-new`, `/babok-status`, `/babok-help` (`commands/*.toml`).
- **Subagents:** `agents/` — orchestrator + stage agents (12 definitions).
- **Always-on rules:** `AGENTS.md` for generic agents and Gemini CLI extension.
- **Uninstall path:** `scripts/uninstall.cjs` cleans external plugin state.
- **Version guard:** `scripts/check-versions.cjs` + `tests/plugin-manifest.test.cjs`, `tests/hooks.test.cjs`, `tests/uninstall.test.cjs`.
- **Agent portability guide:** `docs/agent-portability.md`.
- **Install commands documented** in README and CLAUDE.md for all three hosts.

#### 🌐 Web UI (Next.js 15 App Router) — `web/`
- New `web/` application with full **Next.js 15.5 App Router** setup.
- **Dashboard** — lists all projects with stage progress bars.
- **New project form** — name + language selection.
- **Project detail view** — stage pipeline with status indicators.
- **Stage view** — deliverable Markdown renderer + Approve/Reject buttons.
- **Export page** — one-click ZIP download of all deliverables.
- **API routes:** `GET/POST /projects`, `GET /projects/[id]`, `GET/POST /projects/[id]/stages/[n]`, `GET /projects/[id]/export`.
- **Components:** `StageProgressBar`, `QualityScoreCard`, `DeliverableViewer`, `ApproveRejectButtons`.
- **`lib/babok-client.ts`** — typed API client for server-side communication.

#### 🤖 AI Reasoning Engine — `cli/src/reasoning/`
- **Phase 1 — Quality Scorer (`F3-T1`):**
  - `cli/src/quality/scorer.js` — `scoreStage()` / `scoreAll()` with rubric-based scoring: completeness (40%), SMART quality (30%), cross-stage consistency (30%).
  - `cli/src/quality/checks/completeness.js` — heading-regex section detector.
  - `cli/src/quality/checks/smart.js` — numeric / date / currency / ROI heuristics.
  - `cli/src/quality/checks/consistency.js` — intra-stage cross-reference checks.
  - New CLI command: **`babok score <id> <stage|all>`** with chalk score cards.
- **Phase 1 — Cross-Stage Consistency Validator (`F1-T3`):**
  - `cli/src/validation/cross-stage-validator.js` — `validateProject()` engine with 6 built-in rules:
    - FR Traceability (FR IDs → RTM coverage)
    - Budget Ceiling (Stage 8 vs Stage 1)
    - Integration Coverage (Stage 5 vs Stage 2)
    - KPI Coverage (Stage 2 vs Stage 1)
    - Critical Risk Owner (Stage 7)
    - Roadmap Date (Stage 6 vs Stage 1)
  - New CLI command: **`babok validate <id>`** — exits with code 1 on validation errors.
- **Phase 2 — Multi-Agent Debate Pattern (`F1-T1`):** adversarial reasoning loop for higher-quality stage outputs.
- **Phase 2 — Chain-of-Verification (`F1-T2`):** LLM self-verification pass on generated deliverables.
- **Phase 2 — Gold Standard Evaluation Suite (`F3-T2`):** automated benchmark comparison against reference outputs.

#### 📥 Document Ingestion Pipeline (`F2-T2`) — `cli/src/`
- `cli/src/lib/document-parser.js` — parses **PDF / DOCX / XLSX / CSV / TXT / MD** files.
- `cli/src/commands/ingest.js` — new **`babok ingest <file>`** command with LLM-based document classification and tagging.
- `cli/src/reasoning/prompts/ingest_tagger.md` — LLM classification prompt.
- Ingested documents are listed in `babok status` output.

#### 🗺️ Visual Process Mapping (`F5-T2`) — `cli/src/`
- `cli/src/reasoning/process-mapper.js` — `generateProcessDiagram()` with automatic retry.
- `cli/src/reasoning/prompts/process_to_mermaid.md` — LLM prompt generating Mermaid flowcharts.
- New **`--diagram`** flag for the `babok run` command (available for Stage 2 AS-IS and Stage 5 TO-BE).

#### 🏗️ Architecture & Agent Configuration — `docs/`, `BABOK_AGENT/`
- `docs/L2_L3_ARCHITECTURE.md` — full L2/L3 agent layer design.
- `docs/MCP_TOOLS_SPECIFICATION.md` — MCP tools API reference.
- `docs/MIGRATION_GUIDE_L1_to_L2.md` — CLI-to-MCP migration guide.
- `docs/workflows.md` — end-to-end workflow diagrams.
- `BABOK_AGENT/agents/` — multi-agent orchestration layer:
  - `orchestrator_config.json`, per-stage agent configs (`stage1_config.json` … `stage8_config.json`).
  - `quality_audit_agent.md` / `quality_scoring_rubric.json`.
  - `context_schema_v2.json` — updated context schema v2.
- `BABOK_AGENT_SYSTEM_PROMPT.md` — consolidated root-level system prompt.
- `DEVELOPER_TASKS.md` — full module breakdown with DoD and test plans for all 6 feature pillars.

#### 📦 Document Templates — `templates/`
- `BRD_Template.md`, `Risk_Register_Template.md`, `Stakeholder_Analysis_Template.md`, `User_Story_Template.md`.
- `project_context.example.json` — reference context schema.

#### 🧪 Test Suite (`F6-T1`) — `tests/`
- **73 tests** passing (native `node:test` runner, ESM):
  - `tests/unit/project.test.js` (15 assertions)
  - `tests/unit/journal.test.js` (16 assertions)
  - `tests/unit/scoring.test.js` (14 assertions)
  - `tests/unit/validation.test.js` (18 assertions)
  - `tests/integration/cli-workflow.test.js` (10 steps)
- Fixture files: `valid_stage1.md`, `invalid_stage1_missing_raci.md`, `valid_stage4.md`, etc.
- Test helpers: `mock-llm.js`, `temp-project.js`.

#### 📚 Knowledge Base — `knowledge/`
- 16 JSON benchmark / industry / regulatory / anti-pattern files.
- `knowledge/README.md`.

#### 🛠️ Developer Tooling
- `generate_manual.py` — automated DOCX/PDF user manual generation from Markdown sources.
- `.github/copilot-instructions.md` — 1600-line Copilot Chat integration file.
- `.github/prompts/` — stage-specific Copilot Chat prompt files (`babok-stage-1.prompt.md` … `babok-run-all.prompt.md`).
- `.github/workflows/lint-prompts.yml` — CI prompt linter on push/PR.

### Changed
- **Version bump:** All packages synchronized to `2.1.0` (`cli`, `babok-mcp`, `web`, root workspace).
- **MCP tool count:** Documentation aligned to **16 tools** (was incorrectly listed as 10).
- **Project directory:** Canonical storage documented as `projects/`; `BABOK_Analysis/` marked as legacy CLI export only.
- **`babok-mcp/src/lib/project.js`:** Portable path resolution for `CLAUDE_PLUGIN_ROOT`, `CLAUDE_PROJECT_DIR`, and plugin install layouts.
- **`babok-mcp/` context migrated to v2.0:** Updated `agent_config` and stage configs to use new `context_schema_v2.json`.
- **6 new L2 MCP tools** added to `babok-mcp/`: extending the MCP server API surface.

### Fixed
- **`cli/src/lib/document-parser.js`:** Replaced vulnerable **`xlsx`** dependency with **`exceljs`** (security fix — `xlsx` had unpatched CVE).
- **`cli/src/lib/htmlToText()`:** Simplified tag-filter logic to resolve two CodeQL security warnings (tag injection path).
- **`web/`:** `STAGE_NAMES` constant corrected to use 1-based `Record<number, string>` (was 0-based, causing off-by-one display errors).

### Security
- Removed `xlsx@^0.18.5` from `cli/package.json`; replaced with `exceljs@^4.4.0` — no known CVEs.

## [2.0.0] - 2026-03-16

### Added
- **MCP Server (`babok-mcp/`):** New standalone package exposing BABOK project management as a [Model Context Protocol](https://modelcontextprotocol.io) server. Claude, GPT-4o, and any MCP-compatible AI assistant can now create projects, load stage instructions, approve stages, search deliverables, and export results — without leaving the chat interface.
- **8 MCP Tools:** `babok_new_project`, `babok_list_projects`, `babok_get_stage`, `babok_approve_stage`, `babok_get_deliverable`, `babok_save_deliverable`, `babok_search`, `babok_export`.
- **9 MCP Resources:** All stage prompt files (Stages 0–8) exposed as `babok://stages/{n}` URIs — the AI reads the actual BABOK instructions before working on each stage.
- **Smoke test suite (`babok-mcp/src/test/smoke.js`):** 10 assertions covering ID generation, journal CRUD, approval flow, rejection, partial ID resolution, and deliverable I/O.
- **`BABOK_PROJECTS_DIR` and `BABOK_AGENT_DIR` env vars:** Configure where journals and stage prompts live — works standalone or nested inside the monorepo.

### Architecture
This release adds the `babok-mcp/` package as the second component alongside `cli/`. Both share the same project/journal data model (identical JSON format).

## [1.9.0] - 2026-03-16

### Added
- **Stage 0: Project Charter:** New pre-Stage 1 gate (`BABOK_agent_stage_0.md`) that captures business trigger, sponsor sign-off, and scope boundary in 15–30 minutes. New projects now start at Stage 0.
- **`babok diff` command:** Single-ID mode shows journal stage history with deliverable file preview. Two-ID mode runs an LCS-based line diff across stage deliverables with colored `+/-` output and configurable context (`--context N`).
- **Prompt Linter (`cli/scripts/lint-stages.js`):** Validates all 9 stage files (0–8) for required sections (`## Objectives`, `## Process`), unfilled placeholders, token estimate, and file existence. Exits non-zero on errors.
- **GitHub Actions CI (`.github/workflows/lint-prompts.yml`):** Automatically runs the stage linter on every push or PR that touches `BABOK_AGENT/stages/`.

### Changed
- **Stage validation range:** `babok approve` and `babok reject` now accept stage `0` through `8` (previously `1–8`).
- **Completion message:** "All 8 stages complete!" updated to "All stages complete!" to accommodate variable stage counts.
- **Journal initialization:** New projects include Stage 0 in their `stages` array with `current_stage: 0`.

## [1.8.2] - 2026-02-11

### Added
- **Automated Analysis Pipeline:** New `babok run` command with context-driven execution and optional auto-run mode.
- **Vertex AI Provider Support:** Added Google Vertex AI provider with project/region configuration and credential handling.
- **Copilot Prompt Library:** Added `.github/prompts/` with stage-specific and full-run prompt helpers.
- **Context Template:** Added `templates/project_context.example.json` to standardize run inputs.
- **User Manual (PL):** Added PDF user manual for distribution.

### Changed
- **Provider Picker:** Interactive prompt now supports model selection and stores provider-specific defaults.
- **Model Defaults:** Updated OpenAI and Hugging Face default models and available model lists.
- **Stage 1 Scope Questions:** Simplified initial scope questions to remove redundant document/process list.

### Fixed
- **Chat Initialization:** Await provider initialization in `babok chat` to prevent race conditions.

## [1.8.1] - 2026-02-08

### Fixed
- **Copilot Instructions Versioning:** Updated `.github/copilot-instructions.md` to correctly report version **1.8.1** and align with the 1.8.x release line.
- **Version Metadata Alignment:** Synchronized `VERSION`, CLI `package.json`, and top-level `README.md` footer to **1.8.1**.

## [1.8.0] - 2026-02-08

### Added
- **Sequential Question Protocol (Agent UX):** Agent now asks questions one-by-one with `Question X/Y` indicators, short "Answer recorded" confirmations, and step summaries before document generation.
- **Question Navigation Commands:** Added high-level commands `Next question`, `Previous question`, and `Skip questions` to control question flow.
- **CEO-ready DOCX/PDF Exports:** New CLI `babok make docx|pdf|all` commands to convert stage Markdown files into professionally formatted DOCX and PDF outputs.

### Changed
- **Documentation Updates:** Refined system prompts, Quick Start, Command Reference, and main README to document the sequential question protocol and new document export features.

## [1.7.0] - 2026-02-08

### Added
- **Bilingual Quick Start Commands:** New `begin` and `zacznij` commands as aliases for `babok new`, enabling instant project creation in English or Polish.
- **Enhanced CLI Entry Points:** Multiple command-line entry points for improved accessibility and user experience.

### Changed
- **LLM Management Enhancement:** Improved stability and error handling in LLM provider switching.
- **Project Management:** Enhanced project structure and journaling system for better reliability.

## [1.6.0] - 2026-02-08

### Added
- **Dynamic LLM Management:** New commands `babok llm list` and `babok llm change` to view and switch between 20+ supported models (Gemini 2.0, Claude 3.7, GPT-4o, DeepSeek).
- **In-Chat Model Switching:** Ability to swap AI providers or models mid-conversation using the new `/llm` command without losing history.
- **Bilingual Support (EN/PL):** Complete support for English and Polish languages across CLI and AI Agent.
- **Language Management Commands:** New commands `babok pl`, `babok eng`, and `babok lang` for global language switching.
- **Multilingual Journaling:** Project journals now store and respect language preference (EN/PL) throughout all 8 stages.
- **Localized UI:** Bilingual implementation of all CLI status messages, project creation outputs, and error handling.

### Fixed
- **Terminal Duplication Bug:** Resolved an issue where input characters and outputs were appearing twice in some terminal environments.
- **Project Discovery:** Improved smart path resolution for finding projects in shared workspaces or subdirectories.
- **Gemini API Format:** Fixed `system_instruction` structure for Google Gemini SDK.

### Changed
- **Optimized LLM Prompt:** Shortened the standalone system prompt by **92%** (from ~60k to 5,752 characters) for faster response times and significantly lower token consumption.
- **Improved AI Context:** Enhanced prompt template to explicitly instruct the agent on the target language for each project.

## [1.2.0] - 2026-02-08

### Added
- **Universal Regulatory Framework:** Replaced hardcoded Polish regulations with adaptive "Critical Regulatory Requirements" compatible with any jurisdiction (GDPR, SOX, ISO, etc.).
- **Command Line Interface (CLI):** 30+ terminal-style commands (e.g., `Launch analysis`, `Status`, `Deep analysis`, `Export all`) for power users.
- **Adaptive Model Selection:** Intelligent tiering (Deep Analysis vs. Standard vs. Rapid) based on task complexity.
- **Improved Usability:** `Batch questions`, `Workshop` mode, and `Async` operating modes.

### Changed
- **Start Command:** Updated from `BEGIN STAGE 1` to `Launch analysis`.
- **Documentation:** Unified system prompt structure across all files.

## [1.1.0] - 2026-02-07

### Changed
- **Reasoning Methodology:** Replaced Chain-of-Thought with **Short Rationale + Evidence** format
  - Reduces output verbosity by ~60%
  - Every conclusion now includes: statement, assumptions (max 3-5), evidence source
  - Internal reasoning process no longer exposed

- **Company Positioning:** Updated from "SME/MSP sector" to **"Mid-Market"** (€10-100M revenue, 50-500 employees)
  - Industry focus: Manufacturing, Distribution, Service Industries
  - Added EU/Polish regulatory focus (GDPR, KSeF, sector-specific)

### Added
- **Executive Summary (1 page)** added to all stage deliverable templates (Stages 1-4)
  - Key findings, critical decisions needed, business impact, approval requirements
  - Agent presents summary FIRST, then offers detailed analysis on request

- **Change Control Process** (new Section 9 in Stage 4)
  - Change Request template with impact analysis checklist
  - Change Approval Matrix (Cosmetic → Scope changes with appropriate authority)
  - Change Log, Requirements Versioning (semantic versioning), Baseline Freeze rules
  - Agent instructions: formal CR process for any changes after Stage 4 approval

- **RACI Matrix** added to Stage 1 (Stakeholder Mapping)
  - Responsibility assignment for 10 key project activities
  - Steering Committee structure, quorum rules, decision-making process
  - Escalation path with SLAs

- **DPIA (Data Protection Impact Assessment)** added as Stage 7 appendix
  - GDPR Article 35 compliance template
  - Processing activity description, necessity assessment
  - Risk matrix with mitigation measures
  - Data subject rights implementation plan

- **KSeF Technical Requirements Expansion** (FR-020 in Stage 4)
  - 9 detailed acceptance criteria (AC-020-01 through AC-020-09)
  - Normal flow, validation errors, retry logic, duplicate prevention
  - Monitoring dashboard, environment management (TEST/PROD)
  - Authentication, UPO storage, edge cases (corrections, multi-currency, prepaid)

- **Modeling Notation Standards** added to Stage 2 deliverable template
  - BPMN 2.0 for process flows, UML 2.5 for use cases
  - C4 Model for system architecture, VSM for value streams
  - Quality checklist for all diagrams
  - Stage 5 references same standards

### Reviewed By
- Expert peer review by Grzegorz Skuza (GTMO Framework Author, AI Safety Specialist)
- 8/8 changes accepted (100%)

---

## [1.0.0] - 2026-02-07

### Added
- **BABOK Agent System Prompt** - Main agent instructions implementing BABOK v3 framework
  - 8-stage analysis process (Project Initialization → Business Case & ROI)
  - Chain-of-Thought reasoning with human-in-the-loop validation
  - Specialized for IT projects in SME/MSP sector
  - Polish/English bilingual support
  - Comprehensive documentation templates for each stage
  
- **Quick Start Guide** - Step-by-step instructions for launching the agent
  - Method 1: Claude.ai (Projects)
  - Method 2: VS Code with Claude Code CLI
  - Method 3: VS Code with GitHub Copilot Chat
  - Method 4: ChatGPT or other LLMs
  - Method 5: API (Anthropic, OpenAI)
  
- **Project Structure Template** - Recommended folder organization
  - 8 main folders (01_Project_Charter → 08_Business_Case)
  - Subfolder templates for process maps, requirements, risk registers
  - File naming conventions
  - Sample deliverable descriptions
  
- **GitHub Copilot Integration** - Custom instructions for VS Code
  - Automatic loading of agent configuration
  - Optimized for Copilot Chat interface
  
- **Complete README** - Project documentation
  - Repository structure explanation
  - Installation and setup instructions
  - Multiple deployment methods
  - Best practices and troubleshooting
  - Security and privacy guidelines
  
- **Example Analysis Folder** - Template structure for real projects
  - BABOK_ANALYSIS_System_Potencjalow_02_2026/
  - Complete directory tree with 8 stage folders
  - Ready-to-use structure for document management analysis

### Documentation
- Comprehensive README with 8 deployment methods
- Estimated timeline: 3-4 weeks for complete analysis (8-12 hours with agent)
- Troubleshooting section for common issues
- Communication format and control commands reference

### Technical
- `.gitignore` configured to exclude local analysis files
- Repository structure optimized for GitHub
- Support for Windows, macOS, Linux

### Standards & Compliance
- BABOK v3 (International Institute of Business Analysis) compliant
- GDPR privacy considerations built-in
- ISO 27001 security principles
- Polish regulatory requirements (KSeF, JPK_V7M, RODO)

---

## [Unreleased]

### Planned Features
- Interactive web interface for agent interaction
- Pre-built templates for common industries (retail, manufacturing, services)
- Integration with project management tools (Jira, Azure DevOps)
- Multi-language support (German, French, Spanish)
- Video tutorials for each stage
- Sample completed analyses (anonymized)

---

## Version History

- **1.1.0** (2026-02-07) - Short Rationale methodology, Executive Summaries, Change Control, RACI, DPIA, KSeF expansion, Modeling Standards
- **1.0.0** (2026-02-07) - Initial public release
