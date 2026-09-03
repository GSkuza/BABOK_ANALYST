> **Version:** 0.2 | **Status:** Implemented (v2.3.0) | **Date:** 2026-09-03 | Supersedes v0.1 (parallel-product design)

# BABOK CONSULTING — Architecture & Build Record

A second pipeline shape for BABOK Analyst, targeting non-IT advisory engagements: process optimisation, digital-transformation strategy (business layer), organisation design and C-level advisory. Delivered as the **`consulting` pipeline profile** of the existing product — not as a parallel product.

## 1. Decision: profile, not duplication

v0.1 of this plan proposed a parallel product (`consulting-cli/`, `consulting-mcp/`, `babok-consulting/` plugin, `web/app/consulting/`) built by copying the BABOK engine. A code review against the repository falsified the assumptions that design rested on:

| v0.1 claim | Finding |
|---|---|
| `journal.js` is "driven purely by whatever stage list is passed in" | Hard-coded `STAGE_FILE_NAMES` map; imports `STAGES` from `project.js` |
| `llm.js` is 100 % generic | `loadStagePrompt` / `loadMainSystemPrompt` / `getGenericStagePrompt` hard-code `BABOK_AGENT/...` and 8 BABOK stage names |
| Scorer needs only the `1..8` loop changed | Rubric path hard-coded; `consistency.js` switches on stage number |
| `knowledge-loader.js` needs no change for new categories | Iterates a closed list of four categories |
| Duplication is safe because the repo already does it | The third copy (`plugins/babok_analyst/babok-mcp`) had already drifted (missing `babok_get_stage_template`) |

The consulting pipeline is, structurally, the BABOK pipeline with the requirements stage removed and neighbouring stages merged. That difference is configuration, not architecture. The chosen design therefore parameterises the existing engine **once** and expresses each pipeline as data.

## 2. What was built

### Profile model
- `profiles/profile.schema.json` — JSON Schema for a profile.
- `profiles/babok/profile.json` — describes the existing pipeline (prefix `BABOK`, stages 0–8, existing `BABOK_AGENT/`, `templates/`, rubric paths, existing six validation rules with BABOK bindings, existing `run` sequence). **No BABOK file was moved.**
- `profiles/consulting/profile.json` — prefix `BC`, stages 0–6, own paths, four rules, own pipeline, extra knowledge categories.
- `cli/src/profiles.js` ≡ `babok-mcp/src/lib/profiles.js` — loader (`loadProfile`, `listProfileIds`, `buildProjectIdRegex`, `profileIdFromJournal`, `resolveProfilePath`, stage helpers). Byte-identity enforced by `tests/unit/lib-parity.test.js`, which also now covers `two-key-gate.js`.

### Engine parameterisation (one pass, all interfaces)
| Layer | Change |
|---|---|
| Journal | `createJournal(..., profileId)` writes `journal.profile`; `readJournal` normalises missing field to `babok`; `getProjectProfile(id)` |
| Project IDs | Prefix from profile; listing / resolution by regex over all profile prefixes (CLI, MCP, hooks, web) |
| CLI | `babok new --profile`, `babok run --profile`; `chat`/`score`/`approve`/`reject`/`open-revision`/`diff` take stage bounds and names from the project's profile; `list` shows profile and `n/max` |
| Templates | `resolveTemplatesDir(profile)`, `loadRubric(profile)`, `loadTemplatesForStage(n, { profile })` in both CLI and MCP copies |
| Scoring | Rubric path from profile; built-in consistency checks selected via rubric key `builtin_consistency` (`stakeholder_raci`, `fr_rtm`) — no `switch(stageNumber)` |
| Validation | Every rule is `check(artifacts, bindings)` with BABOK defaults; `RULE_REGISTRY` + `rulesForProfile(profile)`; artifacts built for all profile stages |
| Prompts | `loadStagePrompt(n, profile)`, `loadMainSystemPrompt(profile)` |
| Orchestrator | `runPipeline` executes `profile.orchestrator.pipeline` (sequential / parallel groups) with `deep_analysis_stages` from the profile; quality loop loads the profile's audit prompt |
| Knowledge | `getRelevantKnowledge(ctx, profile)` loads `profile.knowledge.extra_categories`; serialisers for framework and change-management shapes |
| MCP | `babok_new_project { profile }`; all tools resolve stage names / files / prompts / rubric from the journal; `stage_n` schema bound = max over profiles, per-project range enforced at runtime; resources `babok://profiles/<id>/stages/<n>` |
| Hooks | `babok-config.cjs` builds the ID regex from `profiles/*/profile.json`; gate and quality-gate unchanged (they read the journal) |
| Web | `BABOK_PROJECTS_DIR` honoured; all prefixes recognised; journal stage names preferred over legacy labels; profile selector on `/projects/new`; API passes `--profile` to the CLI |
| Scripts / CI | `lint-stages.js` lints every profile; `sync-codex-plugin` copies `profiles/` and `templates/`; workflow watches `profiles/**` and runs profile + parity tests |

### Consulting profile content (`profiles/consulting/`)
- `Consulting_Agent_System_Prompt.md` with the **mandate guardrail** (no requirements, no system design, no vendor selection; systems only as AS-IS context).
- `stages/Consulting_agent_stage_0..6.md` — same skeleton as BABOK prompts (metadata → objectives → sequential `📋 QUESTION i/N` + `[WAIT FOR HUMAN RESPONSE]` → deliverable template reference → quality checklist).
- `templates/manifest.json`, `templates/stages/STAGE_00..06_*.md`, modules: Options Evaluation Matrix, Operating Model Canvas, Root Cause Fishbone, Change Readiness Assessment, Benefits Realization Tracker, RACI & Governance. Shared modules referenced from `templates/modules/`.
- `agents/quality_scoring_rubric.json` (stages 1–6), `agents/quality_audit_agent.md`, `agents/stage1..6_config.json`, `agents/orchestrator_config.json`, `project_context.example.json`.
- Knowledge: `knowledge/frameworks/` (7S, Kotter, ADKAR, DMAIC, Balanced Scorecard, Value Chain), `knowledge/change_management/` (readiness benchmarks, resistance patterns), schemas.

### Consulting pipeline

| # | Stage | Deliverable | Rules touching it |
|---|---|---|---|
| 0 | Engagement Charter & Mandate | `STAGE_00_Engagement_Charter.md` | ROADMAP-DATE (charter), BUDGET-CEILING (charter) |
| 1 | Stakeholder & Governance Mapping | `STAGE_01_Stakeholder_Governance.md` | — |
| 2 | Current State Diagnostic & Root Cause Analysis | `STAGE_02_Current_State_Diagnostic.md` | — |
| 3 | Strategic Options & Recommendation | `STAGE_03_Strategic_Options.md` | RECOMMENDATION-TRACEABILITY (options) |
| 4 | Target Operating Model & Change Roadmap | `STAGE_04_Target_Operating_Model.md` | RECOMMENDATION-TRACEABILITY (tom), ROADMAP-DATE (roadmap) |
| 5 | Risk, Governance & Change Readiness | `STAGE_05_Risk_Change_Readiness.md` | CRITICAL-RISK-OWNER (risk) |
| 6 | Business Case & Value Realization Plan | `STAGE_06_Business_Case_Value.md` | BUDGET-CEILING (business_case) |

`babok run --profile consulting`: `stage1 → parallel[stage2, stage5_initial_risk_scan] → stage3 → stage4 → stage6`; deep-analysis stages 2, 3, 6.

## 3. Deliberately not built (from v0.1)

| v0.1 item | Reason |
|---|---|
| Separate packages / binaries / MCP server / plugin | Duplication with demonstrated drift; profile achieves the same with one engine |
| `konsulting` alias, `-pl` / `-eng` command variants | Language is a parameter; `/babok-new-consulting [PL\|ENG]` suffices |
| `consulting_export_executive_summary` tool | Every deliverable opens with an Executive Summary H2; `babok_export` already ships them |
| `rule-value-ceiling` | Projected value legitimately exceeds initial sizing after option discovery — rule would produce false positives |
| `rule-governance-continuity` | Kept as a rubric consistency check (S5-C1) and in the Stage 5 prompt; not encoded as a text-matching rule because committee names lack a stable identifier format |
| Keyword-based "no-IT" nudge in the quality-gate hook | Moved into the quality-audit agent prompt as a mandate guardrail (feedback via `issues`), where it has context instead of keyword noise |
| Migration of existing journals | Not needed — `readJournal` normalises a missing `profile` to `babok` |

## 4. Verification (executed)

- `npm test` — 106 root tests (baseline) plus new suites; only failure is the pre-existing `plugin-manifest` MCP-launcher assertion unrelated to this work.
- `tests/unit/profiles.test.js` — every profile: contiguous stages, prompt files exist, manifest ↔ stages ↔ deliverable files agree, rubric covers scorable stages, **every skeleton scores 100 % completeness against its rubric**, every rule id registered, every pipeline stage has a config.
- `tests/unit/lib-parity.test.js` — `profiles.js` and `two-key-gate.js` identical across `cli/` and `babok-mcp/`.
- `tests/unit/engine.test.js` — dry-run pipeline order matches each profile's declaration; `stopAfterStage` skips parallel scans above the limit.
- `tests/unit/knowledge-loader.test.js` — framework / change-management content reaches the prompt only when a profile declares the category.
- `tests/hooks.test.cjs` — Two-Key gate blocks saves on approved stages of `BC-` projects.
- `babok-mcp` smoke — profile-aware IDs, journals, deliverable lookup, legacy-journal normalisation.
- Manual CLI: `babok new -p consulting` → `BC-…` with 7 stages; `approve … 7` rejected ("0 and 6"); `score` uses consulting rubric; `validate` runs 4 rules and flags a missing `OPT-NN`.
- `node cli/scripts/lint-stages.js` — both profiles pass.

## 5. Follow-ups (out of scope for 2.3.0)

1. `babok_quality_check` still hard-codes `callGemini('gemini-2.0-flash')`; route through `llm.js` `PROVIDERS` so the MCP and CLI quality paths share one client. Affects BABOK equally.
2. `plugins/babok_analyst/` is a generated copy — run `npm run sync-codex-plugin` before release so the Codex bundle includes `profiles/` and `templates/`.
3. Polish translations of the consulting prompts (`language: PL` currently relies on the agent translating at runtime, as BABOK does).
4. Web: stage page navigation text still says "BABOK stages"; cosmetic.
