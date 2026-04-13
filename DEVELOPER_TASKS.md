# BABOK ANALYST — Developer Task Specification

> **Version:** 1.0 | **Date:** 2026-04-13 | **Based on:** BABOK ANALYST Development Roadmap v1.0

This document translates the six-pillar development roadmap into concrete, ticket-ready developer tasks. Each module corresponds to one pillar. Every task has an unambiguous **Definition of Done** and a **Test Plan** that can be executed after delivery.

---

## Table of Contents

1. [Module F1 — Reasoning Engine](#module-f1--reasoning-engine)
2. [Module F2 — Knowledge Engine](#module-f2--knowledge-engine)
3. [Module F3 — Evaluation & Benchmarking](#module-f3--evaluation--benchmarking)
4. [Module F4 — L2/L3 Orchestration](#module-f4--l2l3-orchestration)
5. [Module F5 — Web UI & Accessibility](#module-f5--web-ui--accessibility)
6. [Module F6 — Testing & CI/CD](#module-f6--testing--cicd)
7. [Implementation Phases & Task Dependencies](#implementation-phases--task-dependencies)
8. [Conventions Used in This Document](#conventions-used-in-this-document)

---

## Module F1 — Reasoning Engine

**Goal:** Structural elimination of cognitive biases and automatic verification of analytical conclusions.  
**Scope:** `cli/src/reasoning/` (new directory)  
**Priority:** CRITICAL  
**Phase:** 2 (starts after F6.1 and F3.2 land)

---

### F1-T1 — Multi-Perspective Reasoning: Debate Pattern

**Description**  
Implement the `debate.js` module. When called for a stage artefact (Stage 3, 4, 6, or 8), it runs two sequential LLM calls against the same input context:

- **Analyst call** — system prompt instructs the model to produce the best-possible BABOK-compliant analysis.
- **Critic call** — system prompt instructs the model to act as a Devil's Advocate: find logical gaps, challenge assumptions, identify alternative interpretations, and surface risks the analyst missed.
- **Synthesiser call** — a third LLM call receives both outputs and produces a final synthesised analysis that incorporates the strongest critiques.

The final synthesised text replaces the raw analyst output as the stage artefact.

**Files to create / modify**

| Action | Path |
|--------|------|
| Create | `cli/src/reasoning/debate.js` |
| Create | `cli/src/reasoning/prompts/analyst.md` |
| Create | `cli/src/reasoning/prompts/critic.md` |
| Create | `cli/src/reasoning/prompts/synthesiser.md` |
| Modify | `cli/src/commands/run.js` — call `runDebate()` for deep-analysis stages (3, 4, 6, 8) |
| Modify | `cli/src/commands/chat.js` — expose `--debate` flag |

**Exported API**

```js
// cli/src/reasoning/debate.js
export async function runDebate(stageNumber, context, llmClient, options = {});
// Returns: { analyst: string, critic: string, synthesis: string, metadata: object }
```

**Definition of Done**

- [ ] `runDebate()` is exported and accepts `stageNumber`, `context` object, `llmClient`, and optional `options`.
- [ ] Two distinct system prompts are used (analyst vs. critic); they are stored in `prompts/*.md` files (not hard-coded in JS).
- [ ] The synthesis call receives both previous outputs in its context.
- [ ] The function returns an object with `analyst`, `critic`, `synthesis`, and `metadata` (model used, token counts, latency ms).
- [ ] `babok run --debate` flag triggers debate mode for stages 3, 4, 6, 8 only; other stages are skipped silently.
- [ ] Debate mode is noted in the stage journal entry (`debate_used: true`).
- [ ] Works with all LLM providers already supported in `cli/src/llm.js` (Anthropic, OpenAI, Gemini).
- [ ] No hard-coded API keys; uses the existing keystore from `cli/src/llm.js`.
- [ ] JSDoc comments on all exported functions.

**Test Plan — F1-T1**

| # | Test | Type | Expected Result |
|---|------|------|-----------------|
| T1 | Call `runDebate(3, mockContext, mockLlm)` where `mockLlm` returns deterministic strings | Unit | Returns object with keys `analyst`, `critic`, `synthesis`, `metadata`; all strings non-empty |
| T2 | `mockLlm` is called exactly 3 times (analyst, critic, synthesiser) | Unit | Call count === 3 |
| T3 | Analyst prompt contains the word `BABOK`; critic prompt contains the word `challenge` or `critique` | Unit | String assertions on prompt files |
| T4 | Pass `stageNumber = 1` (non-deep stage); assert function returns `null` or throws with message indicating debate is disabled for this stage | Unit | Debate not triggered for stage 1 |
| T5 | Run `babok run --debate` on a fixture project with mock LLM; assert journal entry has `debate_used: true` for stage 3 | Integration | `debate_used` field present in journal JSON |
| T6 | Simulate LLM failure on critic call; assert function surfaces error with meaningful message rather than producing corrupt output | Unit | Error propagated with stage/step context |
| T7 | Run debate with Gemini provider (`BABOK_LLM_PROVIDER=gemini`) and with Anthropic provider; assert both work | Integration | Both providers produce non-empty synthesis |

---

### F1-T2 — Chain-of-Verification (CoVe)

**Description**  
Implement the `verify.js` module. After any stage analysis is produced, the module:

1. Sends the analysis to the LLM with a system prompt asking it to generate a numbered list of verification questions about its own conclusions (e.g., "Is the baseline metric on line 12 supported by data provided?").
2. Sends each verification question back to the LLM with the original context and the analysis, asking for a binary answer (CONFIRMED / UNCERTAIN / REFUTED) and a brief justification.
3. For every conclusion marked UNCERTAIN or REFUTED, runs a correction pass that patches only the affected sections.
4. Returns the corrected analysis plus a verification report.

**Files to create / modify**

| Action | Path |
|--------|------|
| Create | `cli/src/reasoning/verify.js` |
| Create | `cli/src/reasoning/prompts/cove_question_gen.md` |
| Create | `cli/src/reasoning/prompts/cove_answer.md` |
| Create | `cli/src/reasoning/prompts/cove_correction.md` |
| Modify | `cli/src/commands/run.js` — run CoVe on all stages when `--verify` flag is passed |

**Exported API**

```js
export async function runCoVe(stageNumber, analysis, context, llmClient, options = {});
// Returns: { corrected: string, verificationReport: VerificationReport }
// VerificationReport: { questions: Question[], corrections: Correction[], questionsTotal: number, refutedCount: number }
```

**Definition of Done**

- [ ] `runCoVe()` exported; accepts `stageNumber`, `analysis` string, `context` object, `llmClient`.
- [ ] Verification questions are generated in a single LLM call and parsed as a numbered list.
- [ ] Each question is answered in a separate LLM call (or batch call); answers are one of: `CONFIRMED`, `UNCERTAIN`, `REFUTED`.
- [ ] Correction pass is triggered only if at least one `UNCERTAIN` or `REFUTED` answer exists.
- [ ] Returned `corrected` string is the original analysis if no corrections were needed (no unnecessary diff).
- [ ] `verificationReport` contains all questions, their answers, and any corrections applied.
- [ ] Verification report is saved alongside the deliverable as `STAGE_NN_verification.json`.
- [ ] Works with all supported LLM providers.
- [ ] `babok run --verify` applies CoVe to all stages.

**Test Plan — F1-T2**

| # | Test | Type | Expected Result |
|---|------|------|-----------------|
| T1 | Call `runCoVe` with analysis containing a deliberate factual inconsistency; mock LLM returns REFUTED for the inconsistent claim | Unit | `correctedAnalysis` differs from input; `refutedCount === 1` |
| T2 | All mock LLM answers are CONFIRMED | Unit | `corrected === analysis` (original unchanged); `corrections.length === 0` |
| T3 | LLM generates 0 verification questions (empty list) | Unit | Function returns early with `corrected === analysis`, no further LLM calls |
| T4 | `STAGE_03_verification.json` exists on disk after `babok run --verify` on fixture project | Integration | File exists; JSON is valid; `questionsTotal > 0` |
| T5 | Verify report contains `refutedCount` field with numeric value | Unit | Field present and is a number >= 0 |
| T6 | Run `runCoVe` with a 5000-token analysis; no truncation errors | Integration | Completes without token limit errors (provider-dependent) |

---

### F1-T3 — Programmatic Cross-Stage Consistency Validator

**Description**  
Implement a deterministic (non-LLM) validator that reads parsed artefact JSON files from all completed stages and checks cross-stage consistency rules. The validator outputs a structured report listing passed and failed checks with severity levels.

Rules to implement (minimum):

1. Every Functional Requirement ID in Stage 4 artefact must appear in the RTM section tracing back to a Stage 3 problem ID.
2. Implementation cost in Stage 8 must be ≤ budget upper bound from Stage 1.
3. Every integration point listed in Stage 5 must correspond to at least one system in the Stage 2 system inventory.
4. Every KPI defined in Stage 1 (with baseline value) must have a corresponding metric in Stage 2 baseline metrics.
5. Every risk in Stage 7 Risk Register with `impact = critical` must have an assigned owner with a non-null date.
6. Stage 6 roadmap end date must be ≤ target completion date from Stage 1 constraints.

**Files to create / modify**

| Action | Path |
|--------|------|
| Create | `cli/src/validation/cross-stage-validator.js` |
| Create | `cli/src/validation/rules/index.js` — rule registry |
| Create | `cli/src/validation/rules/rule-fr-traceability.js` |
| Create | `cli/src/validation/rules/rule-budget-ceiling.js` |
| Create | `cli/src/validation/rules/rule-integration-coverage.js` |
| Create | `cli/src/validation/rules/rule-kpi-coverage.js` |
| Create | `cli/src/validation/rules/rule-critical-risk-owner.js` |
| Create | `cli/src/validation/rules/rule-roadmap-date.js` |
| Create | `cli/src/commands/validate.js` — `babok validate <projectId>` CLI command |
| Modify | `cli/bin/babok.js` — register `validate` command |

**Exported API**

```js
// cross-stage-validator.js
export async function validateProject(projectId, options = {});
// Returns: ValidationReport

// ValidationReport shape:
// { projectId, timestamp, rulesRun, passed, failed, warnings,
//   findings: Finding[] }
// Finding: { ruleId, severity: 'error'|'warning'|'info', message, stagesInvolved, remediation }
```

**Definition of Done**

- [ ] All 6 rules above are implemented and registered.
- [ ] Each rule is in its own file under `cli/src/validation/rules/`.
- [ ] Each rule file exports a single `check(artifacts)` function returning `Finding[]`.
- [ ] `validateProject()` loads all stage artefacts, runs all registered rules, and returns `ValidationReport`.
- [ ] `babok validate <projectId>` CLI command prints a colour-coded report to stdout (green = passed, red = failed, yellow = warning).
- [ ] Exit code 1 when any `severity === 'error'` findings exist; exit code 0 otherwise.
- [ ] Works when some stages are not yet completed (rules that depend on a missing stage are skipped with `status: 'skipped'`).
- [ ] Rules are pluggable: adding a new file to `rules/` and registering it in `index.js` is sufficient to activate it.
- [ ] JSDoc on all exported functions.

**Test Plan — F1-T3**

| # | Test | Type | Expected Result |
|---|------|------|-----------------|
| T1 | Load fixture artefacts where FR-001 has no RTM entry in Stage 4; run rule `rule-fr-traceability` | Unit | Finding with `severity === 'error'` and `ruleId === 'FR_TRACEABILITY'` |
| T2 | Load fixture where Stage 8 cost (€120,000) exceeds Stage 1 budget ceiling (€100,000) | Unit | Finding `severity === 'error'`, rule `BUDGET_CEILING` |
| T3 | All 6 rules pass on a clean, complete fixture project | Unit | `report.failed === 0`; exit code 0 |
| T4 | Run `validateProject` when Stage 6 artefact is missing | Unit | Rule `ROADMAP_DATE` skipped; no crash |
| T5 | Run `babok validate <id>` on CLI with fixture project containing 2 errors | Integration | Stdout contains red error messages; process exits with code 1 |
| T6 | Run `babok validate <id>` on clean project | Integration | Stdout shows all-green; process exits with code 0 |
| T7 | Add a custom rule file to `rules/` and register it; run validation | Integration | Custom rule executes and appears in report |

---

## Module F2 — Knowledge Engine

**Goal:** Give the agent deterministic access to curated domain knowledge and client documents.  
**Scope:** `knowledge/` (new top-level directory), `cli/src/commands/ingest.js`, `cli/src/lib/document-parser.js`  
**Priority:** HIGH  
**Phase:** 3

---

### F2-T1 — Industry Knowledge Base (Static Data Layer)

**Description**  
Create and populate the structured knowledge base files. The knowledge base is NOT a vector database — it is a curated set of JSON files that can be injected as context into LLM prompts. Each file follows a strict JSON schema so that the agent can reference it deterministically.

**Files to create**

| File | Content |
|------|---------|
| `knowledge/industries/manufacturing.json` | Typical processes (order-to-cash, procure-to-pay, plan-to-produce), benchmark KPIs (OEE, inventory turnover, invoice processing time), common pain points, typical IT systems |
| `knowledge/industries/distribution.json` | Warehouse, logistics, last-mile processes, KPIs (OTIF, fill rate), pain points |
| `knowledge/industries/services.json` | Professional services, service delivery, knowledge management processes, KPIs (utilisation rate, NPS) |
| `knowledge/regulations/gdpr_checklist.json` | Per-article requirements, enforcement precedents, DPIA triggers |
| `knowledge/regulations/einvoicing/poland_ksef.json` | KSeF technical requirements, mandatory fields, submission flow |
| `knowledge/regulations/einvoicing/germany_xrechnung.json` | XRechnung schema requirements |
| `knowledge/regulations/iso27001.json` | Control categories, typical SME gaps, audit checklist |
| `knowledge/benchmarks/document_automation.json` | Industry benchmark data: median invoice processing time, error rates, ROI ranges, payback periods |
| `knowledge/benchmarks/erp_implementation.json` | Cost ranges by company size, implementation durations, failure rates |
| `knowledge/benchmarks/process_optimization.json` | Lean/Six Sigma benchmark savings percentages |
| `knowledge/technology/dms_comparison.json` | Top 8 DMS solutions: features, pricing model, integration capabilities, pros/cons |
| `knowledge/technology/erp_landscape.json` | ERP vendors for mid-market: SAP B1, MS Dynamics 365 BC, Odoo, Epicor — feature comparison |
| `knowledge/technology/integration_patterns.json` | Common integration patterns (REST API, SFTP, EDI, iPaaS) with use cases |
| `knowledge/anti_patterns/requirements_mistakes.json` | Top 15 requirements anti-patterns with symptoms and corrections |
| `knowledge/anti_patterns/roi_calculation_errors.json` | Common ROI model mistakes (double counting savings, ignoring TCO, etc.) |
| `knowledge/anti_patterns/stakeholder_pitfalls.json` | Typical stakeholder engagement failures and recovery strategies |
| `knowledge/schema/industry.schema.json` | JSON Schema for all industry files |
| `knowledge/schema/regulation.schema.json` | JSON Schema for all regulation files |
| `knowledge/schema/benchmark.schema.json` | JSON Schema for all benchmark files |
| `knowledge/README.md` | Structure documentation and usage guide for developers |

**Loader module**

| Action | Path |
|--------|------|
| Create | `cli/src/lib/knowledge-loader.js` |

```js
// knowledge-loader.js
export function loadKnowledge(category, key);
// e.g. loadKnowledge('industries', 'manufacturing') → parsed JSON
export function getRelevantKnowledge(projectContext);
// Infers relevant files from project context (industry, regulations, etc.)
// Returns: { industries: [...], regulations: [...], benchmarks: [...], technology: [...] }
export function formatKnowledgeForPrompt(knowledgeSet, maxTokens = 4000);
// Truncates/summarises to fit within token budget; returns formatted Markdown string
```

**Definition of Done**

- [ ] All 18 JSON files exist and are valid JSON.
- [ ] Each JSON file conforms to its schema (validated by `ajv` or equivalent).
- [ ] Every industry file contains at minimum: `processes` (≥5), `kpis` (≥5 with baseline values), `pain_points` (≥5), `typical_systems` (≥3).
- [ ] Every benchmark file contains at minimum 3 data points with `source` and `year` fields.
- [ ] `loadKnowledge()` exported and returns parsed JSON for any valid category/key.
- [ ] `getRelevantKnowledge()` selects the correct industry and regulation files based on `projectContext.industry` and `projectContext.regulations`.
- [ ] `formatKnowledgeForPrompt()` respects the `maxTokens` limit (character approximation acceptable; exact token counting not required at this stage).
- [ ] `knowledge/README.md` documents all files, their schema, and how to add new entries.

**Test Plan — F2-T1**

| # | Test | Type | Expected Result |
|---|------|------|-----------------|
| T1 | Validate all JSON files against their schemas | Unit (automated) | Zero schema violations |
| T2 | `loadKnowledge('industries', 'manufacturing')` returns object with `processes`, `kpis`, `pain_points` keys | Unit | Correct structure |
| T3 | `loadKnowledge('regulations', 'nonexistent')` throws descriptive error | Unit | Error message includes available keys |
| T4 | `getRelevantKnowledge({ industry: 'manufacturing', regulations: ['gdpr'] })` returns manufacturing industry data + gdpr data | Unit | Both files in result |
| T5 | `formatKnowledgeForPrompt(knowledge, 2000)` returns string with length ≤ 2000 characters | Unit | Length constraint respected |
| T6 | Every benchmark JSON has `source` and `year` fields on every data point | Unit (automated) | Zero violations |

---

### F2-T2 — Document Ingestion Pipeline (`babok ingest`)

**Description**  
Implement a new CLI command `babok ingest <file> --project <id>` that:

1. Detects file type (PDF, DOCX, XLSX, CSV, TXT, MD).
2. Extracts text/structured data from the file.
3. Analyses the extracted content with an LLM call and tags each extracted section with relevance to one or more BABOK stages (e.g., `stage1`, `stage2`, `stage4`).
4. Saves the structured ingestion result to `<projectDir>/ingested/<filename>.json`.
5. Updates the project journal to record that ingested documents are available.

The LLM tagging prompt must classify sections into: `scope_info`, `stakeholder_info`, `process_description`, `financial_data`, `regulatory_requirement`, `technical_constraint`, `other`.

**Files to create / modify**

| Action | Path |
|--------|------|
| Create | `cli/src/commands/ingest.js` |
| Create | `cli/src/lib/document-parser.js` |
| Create | `cli/src/reasoning/prompts/ingest_tagger.md` |
| Modify | `cli/bin/babok.js` — register `ingest` command |
| Modify | `cli/package.json` — add `pdf-parse`, `xlsx` dependencies |

**Exported parser API**

```js
// document-parser.js
export async function parseDocument(filePath);
// Returns: { fileName, fileType, sections: [{ content, pageOrSheet }], rawText }
// Supports: .pdf (via pdf-parse), .docx (via existing docx dep), .xlsx/.csv (via xlsx), .txt/.md (plain read)
```

**Definition of Done**

- [ ] `babok ingest <file> --project <id>` is a registered CLI command.
- [ ] Supported file types: `.pdf`, `.docx`, `.xlsx`, `.csv`, `.txt`, `.md`.
- [ ] Unsupported file types produce a clear error message listing supported types.
- [ ] `parseDocument()` exported from `document-parser.js`; works without LLM (pure extraction).
- [ ] Tagging LLM call uses the prompt from `ingest_tagger.md` (not hard-coded).
- [ ] Result saved to `<projectDir>/ingested/<originalFilename>.json` with schema: `{ fileName, fileType, ingestedAt, sections, tags }`.
- [ ] Journal updated with `ingested_documents: [{ fileName, ingestedAt, stagesTagged }]`.
- [ ] `babok status <id>` shows count of ingested documents.
- [ ] `pdf-parse` and `xlsx` added to `cli/package.json` dependencies.

**Test Plan — F2-T2**

| # | Test | Type | Expected Result |
|---|------|------|-----------------|
| T1 | `parseDocument('fixtures/sample.pdf')` — fixture PDF with 3 pages | Unit | Returns object with `sections.length === 3`; `rawText` non-empty |
| T2 | `parseDocument('fixtures/sample.xlsx')` — fixture with 2 sheets | Unit | Returns sections for each sheet; `fileType === 'xlsx'` |
| T3 | `parseDocument('fixtures/unsupported.zip')` | Unit | Throws error with "Unsupported file type" message |
| T4 | Run `babok ingest fixtures/sample.pdf --project <id>` on fixture project | Integration | `ingested/sample.pdf.json` exists; journal has `ingested_documents` entry |
| T5 | Ingested JSON contains `tags` field with at least one entry; each tag has `stageRelevance` array | Integration | Valid structure |
| T6 | Run `babok status <id>` after ingest; assert "1 document ingested" appears in output | Integration | Status output contains ingested document count |
| T7 | Run ingest on `.md` file (no LLM dependency); assert no LLM calls made | Unit | `parseDocument` for `.md` is pure extraction |

---

## Module F3 — Evaluation & Benchmarking

**Goal:** Mierzalne dowody jakości analizy; mech anizm regresji po zmianach promptów.  
**Scope:** `evaluation/` (new top-level directory), `cli/src/quality/`  
**Priority:** HIGH  
**Phase:** 1 (scorer) + Phase 2 (gold standards)

---

### F3-T1 — Automated Quality Scorer

**Description**  
Implement the quality scoring engine that materialises `BABOK_AGENT/agents/quality_scoring_rubric.json` as executable code. The scorer is a deterministic (non-LLM) module that reads a deliverable Markdown file and scores it on three dimensions.

**Scoring logic to implement:**

- **Completeness (40%):** Use regex/string matching to check whether each required section header from the rubric is present and has content below it (not empty).
- **Consistency (30%):** Programmatic cross-reference checks (delegating to F1-T3 validator for inter-stage checks; intra-stage checks implemented here).
- **Quality/SMART (30%):** Heuristic checks on the text: Does each KPI contain a number? Does each deadline contain a date pattern (YYYY-MM-DD or similar)? Does each budget entry contain a currency symbol and a number?

**Files to create / modify**

| Action | Path |
|--------|------|
| Create | `cli/src/quality/scorer.js` |
| Create | `cli/src/quality/checks/completeness.js` |
| Create | `cli/src/quality/checks/smart.js` |
| Create | `cli/src/quality/checks/consistency.js` |
| Create | `cli/src/commands/score.js` — `babok score <projectId> <stageNumber>` |
| Modify | `cli/bin/babok.js` — register `score` command |

**Exported API**

```js
// scorer.js
export async function scoreStage(projectId, stageNumber, options = {});
// Returns: ScoreReport
// ScoreReport: { projectId, stage, timestamp, scores: { completeness, consistency, quality, overall },
//               passed: boolean, issues: ScorerIssue[], rubricVersion }
// ScorerIssue: { dimension, ruleId, severity, message, remediation }
```

**Definition of Done**

- [ ] `scoreStage()` exported; reads rubric from `BABOK_AGENT/agents/quality_scoring_rubric.json`.
- [ ] All 8 stages (1–8) have working completeness checks (required sections from rubric).
- [ ] SMART checks implemented for at minimum: numeric KPIs in Stage 1, date-bound deadlines in Stage 1 & 6, numeric thresholds in Stage 4 NFRs.
- [ ] `passed` is `true` when `overall >= 75`.
- [ ] Score report saved to `<projectDir>/scores/STAGE_NN_score.json` on every run.
- [ ] `babok score <id> <stage>` prints a colour-coded score card to stdout.
- [ ] Running `babok score <id> all` scores all completed stages and prints a summary table.
- [ ] Rubric version from JSON is embedded in the score report for traceability.
- [ ] 100% deterministic: same input always produces same output.

**Test Plan — F3-T1**

| # | Test | Type | Expected Result |
|---|------|------|-----------------|
| T1 | Score Stage 1 fixture missing `RACI Matrix` section | Unit | Completeness score < 100; finding with `ruleId` referencing `RACI Matrix` |
| T2 | Score Stage 1 fixture with all required sections present and populated | Unit | Completeness score = 100 |
| T3 | Score Stage 1 fixture where KPI has no numeric baseline | Unit | SMART dimension finding; `severity === 'major'` |
| T4 | Score Stage 6 fixture where milestone date is written as "Q3 2026" instead of a calendar date | Unit | SMART finding for time-bound criterion |
| T5 | `overall` formula: completeness=80, consistency=90, quality=70 → `overall = 80×0.4 + 90×0.3 + 70×0.3 = 80` | Unit | `overall === 80` |
| T6 | `overall = 74` → `passed === false`; `overall = 75` → `passed === true` | Unit | Boundary condition correct |
| T7 | Run `babok score <id> 1` on CLI; `STAGE_01_score.json` created | Integration | File exists; valid JSON; `rubricVersion` present |
| T8 | Run `babok score <id> all`; summary table printed, one row per completed stage | Integration | Table has correct stage count |

---

### F3-T2 — Gold Standard Evaluation Suite

**Description**  
Create three reference case studies (anonimised) representing the three target industries. Each case study has a carefully crafted input (project context JSON) and reference deliverables for each stage (what an expert CBAP would produce). The suite includes an automated benchmark runner that runs the BABOK agent on each case study and produces a comparison report.

**Files to create**

```
evaluation/
├── gold_standards/
│   ├── case_001_manufacturing_dms/
│   │   ├── input.json               # project context + question answers
│   │   ├── expected_stage1.md       # reference deliverable
│   │   ├── expected_stage2.md
│   │   ├── expected_stage3.md
│   │   ├── expected_stage4.md
│   │   ├── expected_stage5.md
│   │   ├── expected_stage6.md
│   │   ├── expected_stage7.md
│   │   ├── expected_stage8.md
│   │   └── case_metadata.json       # industry, complexity, source
│   ├── case_002_distribution_erp/
│   │   └── (same structure)
│   └── case_003_services_workflow/
│       └── (same structure)
├── scoring/
│   ├── automated_scorer.js          # compare agent output vs. expected
│   └── human_scoring_template.md    # rubric for human evaluators
├── benchmarks/
│   ├── run_benchmark.js             # CLI: node evaluation/benchmarks/run_benchmark.js <case_id>
│   └── results/                     # timestamped JSON result files
└── README.md
```

**Automated scorer logic (`evaluation/scoring/automated_scorer.js`)**

- **Section coverage score:** % of sections present in expected output that are also present in agent output.
- **SMART compliance delta:** difference in SMART score between agent output and expected output.
- **Length ratio:** agent output length / expected output length (flag if < 0.5 or > 3.0).
- **Keyword presence:** check that key domain terms from the expected output appear in the agent output.

**Definition of Done**

- [ ] All three case study `input.json` files are realistic, self-consistent, and cover different industries.
- [ ] Each case study has reference deliverables for all 8 stages (Stage 0–8 = 9 files per case × 3 cases = 27 deliverable files).
- [ ] `case_metadata.json` per case documents: industry, company size, primary driver, complexity (low/medium/high), author, date.
- [ ] `automated_scorer.js` computes section coverage score (0–100) for each stage.
- [ ] `run_benchmark.js` accepts a case ID, runs the agent (in non-interactive `--auto` mode with mock LLM or real LLM), compares outputs, and saves `results/<caseId>_<timestamp>.json`.
- [ ] Benchmark result JSON contains per-stage scores and an overall case score.
- [ ] `evaluation/README.md` documents: how to run benchmarks, how to add a new case, interpretation of scores.
- [ ] `human_scoring_template.md` provides a printable rubric for external CBAP evaluators.

**Test Plan — F3-T2**

| # | Test | Type | Expected Result |
|---|------|------|-----------------|
| T1 | Validate all `input.json` files against `templates/project_context.example.json` schema | Unit | Zero schema violations |
| T2 | All expected deliverable files are non-empty and contain required section headers per rubric | Unit | Completeness check on each expected file: score ≥ 85 |
| T3 | `automated_scorer.js` on identical input/expected returns score = 100 for section coverage | Unit | Score === 100 |
| T4 | `automated_scorer.js` on completely different text returns score near 0 | Unit | Score < 20 |
| T5 | `run_benchmark.js case_001` completes without error (with mock LLM) | Integration | Exit code 0; results file created |
| T6 | Benchmark result JSON contains `perStageScores` array with 8 entries | Integration | Array length === 8 |
| T7 | Run all three cases; results directory contains 3 result files | Integration | 3 files in `evaluation/benchmarks/results/` |

---

## Module F4 — L2/L3 Orchestration

**Goal:** Implement the multi-agent pipeline and autonomous quality loop — turning JSON configurations into running code.  
**Scope:** `cli/src/orchestrator/` (new directory)  
**Priority:** HIGH  
**Phase:** 3

---

### F4-T1 — Orchestrator Engine (L2)

**Description**  
Implement the pipeline engine that reads `BABOK_AGENT/agents/orchestrator_config.json` and stage configs (`stage1_config.json` … `stage8_config.json`) and executes the BABOK pipeline. The engine:

1. Creates a project or loads an existing one.
2. Runs stages in the sequence defined by `mandatory_sequence`, respecting `parallel_groups`.
3. For each stage: loads the appropriate LLM model from the stage config, injects the shared context, calls the stage agent (via the existing `cli/src/llm.js` client), saves the artefact.
4. Passes the updated shared context to the next stage.
5. Emits events for external consumers (progress bar, logging).

**Files to create / modify**

| Action | Path |
|--------|------|
| Create | `cli/src/orchestrator/engine.js` |
| Create | `cli/src/orchestrator/context-manager.js` |
| Create | `cli/src/orchestrator/parallel-runner.js` |
| Create | `cli/src/orchestrator/stage-executor.js` |
| Modify | `cli/src/commands/run.js` — use orchestrator engine when `--orchestrate` flag is passed |

**Exported API**

```js
// engine.js
export async function runPipeline(projectId, options = {});
// options: { maxParallel, dryRun, stopAfterStage, onProgress }
// onProgress: (event: PipelineEvent) => void
// Returns: PipelineResult { projectId, stagesCompleted, stagesFailed, totalDurationMs, artefacts }

// context-manager.js
export function readContext(projectId);
export function writeContext(projectId, context);
export function mergeStageOutput(projectId, stageKey, output);
```

**Definition of Done**

- [ ] `runPipeline()` exported; reads orchestrator config and stage configs from disk.
- [ ] Stages execute in the correct order per `mandatory_sequence`.
- [ ] Parallel groups (`stage2` and `stage7_initial_risk_scan`) run concurrently using `Promise.all`.
- [ ] Each stage uses the model specified in its stage config (`provider`, `model`, `temperature`).
- [ ] Context is read before each stage and written after each stage completes.
- [ ] Stage artefacts are saved to `<projectDir>/artifacts/stage<N>/`.
- [ ] `onProgress` callback fires at minimum: `stage_started`, `stage_completed`, `stage_failed`, `pipeline_complete`.
- [ ] `--dryRun` mode runs the pipeline without LLM calls (uses mock responses); useful for CI testing.
- [ ] `stopAfterStage` option halts the pipeline after a given stage and saves state.
- [ ] `babok run --orchestrate <id>` uses the new engine.

**Test Plan — F4-T1**

| # | Test | Type | Expected Result |
|---|------|------|-----------------|
| T1 | Run `runPipeline` with `dryRun: true` on fixture project | Unit | All 8 stages complete; no LLM calls; all artefact files created with placeholder content |
| T2 | Stage execution order matches `mandatory_sequence` from config | Unit | Logged order === `['stage1', 'stage2', 'stage3', ...]` |
| T3 | Stage 2 and Stage 7 initial scan are started simultaneously (both `stage_started` events fire before either `stage_completed`) | Unit | Event log ordering check |
| T4 | `stopAfterStage: 3` halts pipeline; stages 4–8 not executed | Unit | `stagesCompleted.length === 3` (0 through 3 excluding parallel group details) |
| T5 | Stage failure (mock LLM throws) triggers `stage_failed` event with error; pipeline stops | Unit | Event emitted; subsequent stages not started |
| T6 | Context JSON updated after each stage with stage key set to `completed` | Unit | After stage 1, `context.stages.stage1.status === 'completed'` |
| T7 | Run pipeline with `--orchestrate` on CLI | Integration | Exit code 0; all artefact files on disk |

---

### F4-T2 — Autonomous Quality Audit Loop (L3)

**Description**  
Implement the autonomous quality loop that runs after each stage in the orchestrated pipeline:

1. Stage agent produces a deliverable.
2. Quality Audit Agent (driven by `BABOK_AGENT/agents/quality_audit_agent.md` system prompt + `quality_scoring_rubric.json`) scores the artefact using the LLM.
3. If `overall < 75`: generate a list of specific improvement instructions; re-run the stage agent with those instructions appended to the context.
4. Repeat up to `max_iterations` (default 3) times.
5. If score still < 75 after 3 iterations: set stage status to `needs_human_review` and emit `quality_escalate` event.
6. If score >= 75: approve the stage automatically, proceed to next stage.

**Files to create / modify**

| Action | Path |
|--------|------|
| Create | `cli/src/orchestrator/quality-loop.js` |
| Modify | `cli/src/orchestrator/engine.js` — call quality loop after each stage |

**Exported API**

```js
// quality-loop.js
export async function runQualityLoop(projectId, stageNumber, artefact, llmClient, options = {});
// options: { maxIterations, scoreThreshold, onIteration }
// Returns: QualityLoopResult { finalArtefact, finalScore, iterations, passed, escalated }
```

**Definition of Done**

- [ ] `runQualityLoop()` exported; uses the quality audit agent system prompt from `quality_audit_agent.md`.
- [ ] Quality Agent LLM call uses Deep Analysis model (`gemini-pro` or `claude-opus` depending on provider).
- [ ] Improvement instructions are appended to the stage agent context in subsequent iterations (not to the quality agent context).
- [ ] Loop stops immediately when score >= 75 (does not always run max iterations).
- [ ] Loop stops after `maxIterations` even if score < 75; `escalated: true` in result.
- [ ] Each iteration is logged to `<projectDir>/quality_iterations/STAGE_NN_iter<N>.json` (artefact snapshot + score).
- [ ] Journal updated: `quality_reports` field populated per `my_project_context.json` schema v2.0.
- [ ] `quality_escalate` event emitted via `onIteration` callback when escalation occurs.
- [ ] Works in `dryRun` mode (mock scores: always returns 80 on first iteration).

**Test Plan — F4-T2**

| # | Test | Type | Expected Result |
|---|------|------|-----------------|
| T1 | Mock quality scorer returns 60 on iterations 1–2, then 80 on iteration 3 | Unit | `iterations === 3`; `passed === true`; `escalated === false` |
| T2 | Mock quality scorer always returns 60 (3 iterations exhausted) | Unit | `escalated === true`; `passed === false`; `iterations === 3` |
| T3 | Mock quality scorer returns 80 on first iteration | Unit | `iterations === 1`; loop does not continue |
| T4 | Three artefact snapshot files exist on disk after 3 iterations | Unit | Files exist for iter 1, 2, 3 |
| T5 | Journal `quality_reports.stage1.scores.overall` equals final score | Unit | Value matches `finalScore` |
| T6 | `quality_escalate` event fires when escalation occurs | Unit | Callback called with `{ stage, iteration, score }` |
| T7 | Run full pipeline with quality loop on fixture project in `dryRun` mode; all stages pass | Integration | All stages `passed === true`; no escalations |

---

## Module F5 — Web UI & Accessibility

**Goal:** Browser-based interface for non-technical users; visual process diagrams.  
**Scope:** `web/` (new top-level directory)  
**Priority:** MEDIUM  
**Phase:** 4

---

### F5-T1 — Web Application MVP

**Description**  
Create a Next.js 14 (App Router) web application that serves as a frontend for the BABOK MCP server. Communication uses HTTP via a lightweight REST wrapper around the existing MCP server functions.

**Views to implement (MVP):**

| View | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | List all projects; show stage progress bars; quality scores per stage |
| Project Detail | `/projects/[id]` | Stage pipeline view; click stage to open |
| Stage View | `/projects/[id]/stages/[n]` | Display deliverable; Approve / Reject buttons |
| Export | `/projects/[id]/export` | Download DOCX / PDF / ZIP |
| New Project | `/projects/new` | Form to create new project |

**Files to create**

```
web/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                        # Dashboard
│   ├── projects/
│   │   ├── new/page.tsx
│   │   ├── [id]/page.tsx
│   │   ├── [id]/stages/[n]/page.tsx
│   │   └── [id]/export/page.tsx
│   └── api/
│       ├── projects/route.ts           # GET list, POST new
│       ├── projects/[id]/route.ts      # GET detail
│       ├── projects/[id]/stages/[n]/route.ts   # GET, POST approve/reject
│       └── projects/[id]/export/route.ts
├── components/
│   ├── StageProgressBar.tsx
│   ├── QualityScoreCard.tsx
│   ├── DeliverableViewer.tsx           # Markdown renderer
│   └── ApproveRejectButtons.tsx
├── lib/
│   └── babok-client.ts                 # HTTP client wrapping MCP server calls
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

**Definition of Done**

- [ ] `web/` directory contains a working Next.js 14 app bootstrapped with `create-next-app`.
- [ ] All 5 views are implemented and navigable.
- [ ] Dashboard displays all projects from MCP server with stage status indicators.
- [ ] Stage View renders deliverable Markdown as HTML.
- [ ] Approve / Reject buttons call the MCP server and update UI optimistically.
- [ ] Export view triggers ZIP / DOCX / PDF download (delegates to `babok export` via API route).
- [ ] App runs with `npm run dev` in `web/`; no hard-coded ports (reads from `BABOK_MCP_URL` env var, defaults to `http://localhost:3001`).
- [ ] `web/README.md` documents: prerequisites, setup steps, environment variables.
- [ ] No TypeScript errors on `npm run build`.
- [ ] Responsive layout (works on 1280px desktop; gracefully degrades on 768px tablet).

**Test Plan — F5-T1**

| # | Test | Type | Expected Result |
|---|------|------|-----------------|
| T1 | `npm run build` in `web/` | Build | Exit code 0; no TypeScript errors |
| T2 | Start dev server; navigate to `/`; Dashboard renders with mock API | E2E (Playwright) | Page loads; "Projects" heading visible |
| T3 | Click "New Project"; fill form; submit; redirected to project detail page | E2E | Project created; ID in URL |
| T4 | Navigate to Stage View with fixture deliverable; Markdown renders as HTML | E2E | `<h1>` tags present in DOM |
| T5 | Click "Approve" button; stage badge updates to "Approved" | E2E | Stage status updates without page reload |
| T6 | Click "Download ZIP" on Export view; file download triggered | E2E | `content-disposition` header contains `attachment` |
| T7 | `BABOK_MCP_URL` not set; app falls back to `http://localhost:3001` | Unit | `babok-client.ts` uses correct default |

---

### F5-T2 — Visual Process Mapping (BPMN/Flowchart Generation)

**Description**  
Implement automatic diagram generation from process descriptions in Stage 2 (AS-IS) and Stage 5 (TO-BE). The LLM converts a prose process description into Mermaid flowchart syntax, which is then rendered as SVG in the web UI.

**Files to create / modify**

| Action | Path |
|--------|------|
| Create | `cli/src/reasoning/process-mapper.js` |
| Create | `cli/src/reasoning/prompts/process_to_mermaid.md` |
| Modify | `web/components/DeliverableViewer.tsx` — detect Mermaid code blocks and render as SVG |
| Modify | `web/package.json` — add `mermaid` dependency |

**Exported API**

```js
// process-mapper.js
export async function generateProcessDiagram(processDescription, llmClient, options = {});
// Returns: { mermaidSyntax: string, diagramType: 'flowchart'|'sequence', warnings: string[] }
```

**Definition of Done**

- [ ] `generateProcessDiagram()` exported; sends process description to LLM using `process_to_mermaid.md` prompt.
- [ ] Returns valid Mermaid `flowchart LR` or `flowchart TD` syntax.
- [ ] LLM output is validated: parse with Mermaid parser; if invalid, retry once with error feedback.
- [ ] Web UI renders Mermaid diagrams as interactive SVG (zoom, pan) wherever a stage deliverable contains a ` ```mermaid ` code block.
- [ ] Stage 2 and Stage 5 deliverable templates include Mermaid placeholders.
- [ ] `babok run` with `--diagram` flag calls `generateProcessDiagram` for Stage 2 and Stage 5 and embeds Mermaid in the output.
- [ ] Works offline (Mermaid renders client-side, no CDN dependency in production build).

**Test Plan — F5-T2**

| # | Test | Type | Expected Result |
|---|------|------|-----------------|
| T1 | `generateProcessDiagram("A sends invoice to B. B validates. B pays.")` with mock LLM returning valid Mermaid | Unit | `mermaidSyntax` starts with `flowchart`; `warnings.length === 0` |
| T2 | Mock LLM returns invalid Mermaid; assert retry with error message in context | Unit | Second LLM call made; first call's invalid output referenced in retry prompt |
| T3 | Stage 2 fixture deliverable contains ` ```mermaid ` block; web UI renders SVG element | E2E | `<svg>` element present in DOM |
| T4 | Mermaid diagram SVG has at least 2 nodes (rectangles/diamonds) | E2E | SVG children count > 1 |
| T5 | `npm run build` with Mermaid bundled | Build | No build errors; bundle size check passes (< 2MB) |

---

## Module F6 — Testing & CI/CD

**Goal:** Solid test foundation; CI gates on every PR.  
**Scope:** `tests/` (new top-level directory), `.github/workflows/`  
**Priority:** HIGH  
**Phase:** 1 (starts first, before other modules)

---

### F6-T1 — Comprehensive Unit & Integration Test Suite

**Description**  
Create the full test suite in the `tests/` directory. This module is the **first to be delivered** as it provides the safety net for all subsequent modules.

**Framework:** Node.js native `node:test` (available in Node ≥18; no external test runner required to keep dependencies minimal). Alternatively, `vitest` if the team prefers (add to `package.json` at root level).

**Files to create**

```
tests/
├── unit/
│   ├── project.test.js               # generateProjectId, resolveProjectId, path helpers
│   ├── journal.test.js               # createJournal, readJournal, approveStage, rejectStage
│   ├── validation.test.js            # cross-stage-validator (F1-T3)
│   └── scoring.test.js               # quality scorer (F3-T1)
├── integration/
│   ├── cli-workflow.test.js          # new → approve → export workflow
│   ├── mcp-server.test.js            # MCP tool calls via server.js
│   └── orchestrator.test.js          # pipeline engine (F4-T1)
├── fixtures/
│   ├── sample_project/
│   │   ├── journal.json
│   │   └── artifacts/
│   │       ├── STAGE_01_Project_Initialization.md
│   │       └── STAGE_02_Current_State_Analysis.md
│   ├── valid_stage1.md               # fully compliant Stage 1 deliverable
│   ├── invalid_stage1_missing_raci.md
│   ├── invalid_stage1_no_kpi_numbers.md
│   ├── valid_stage4.md
│   └── invalid_stage4_no_traceability.md
├── helpers/
│   ├── mock-llm.js                   # deterministic mock LLM client
│   └── temp-project.js              # creates/destroys tmp project dirs in tests
└── package.json                      # test runner config (if separate from root)
```

**Mock LLM helper spec (`tests/helpers/mock-llm.js`):**

```js
export function createMockLlm(responses = {});
// responses: { [stageKey]: string } — maps stage key to deterministic response
// Falls back to a standard fixture response if key not found
// Tracks call history: mockLlm.calls → array of { prompt, model, timestamp }
```

**Definition of Done**

- [ ] `tests/` directory structure created as above.
- [ ] All fixture files created (minimum: `valid_stage1.md`, `invalid_stage1_missing_raci.md`, `valid_stage4.md`, `invalid_stage4_no_traceability.md`).
- [ ] `mock-llm.js` and `temp-project.js` helpers implemented and used by all integration tests.
- [ ] `unit/project.test.js`: ≥ 10 assertions covering ID format, partial resolution, path helpers.
- [ ] `unit/journal.test.js`: ≥ 12 assertions covering all journal operations including edge cases (double approve, reject after approve).
- [ ] `unit/validation.test.js`: ≥ 6 assertions (one per rule); requires F1-T3 to be complete.
- [ ] `unit/scoring.test.js`: ≥ 8 assertions covering all dimensions; requires F3-T1 to be complete.
- [ ] `integration/cli-workflow.test.js`: full workflow test from `new` to `export`; uses temp project.
- [ ] `integration/mcp-server.test.js`: tests all 8 existing MCP tools via direct function calls (not over stdio).
- [ ] All unit tests run in < 5 seconds total.
- [ ] All integration tests run in < 30 seconds total.
- [ ] `npm test` at repository root runs all tests (configure root `package.json` script).

**Test Plan — F6-T1 (this task IS the tests)**

Acceptance is verified by running `npm test` and confirming:

| Metric | Target |
|--------|--------|
| Unit tests pass | 100% |
| Integration tests pass | 100% |
| Total runtime | < 60 seconds |
| Code coverage (unit layer) | ≥ 80% line coverage on `cli/src/lib/*.js` and `babok-mcp/src/lib/*.js` |

---

### F6-T2 — CI/CD Pipeline Enhancement

**Description**  
Extend `.github/workflows/` with three new workflows plus improvements to the existing `lint-prompts.yml`.

**Workflows to create / modify**

| File | Trigger | Purpose |
|------|---------|---------|
| `.github/workflows/test.yml` | push + PR (all branches) | Run unit + integration tests |
| `.github/workflows/e2e.yml` | push to `main` + scheduled (daily 02:00 UTC) | Run benchmark evaluation (dry-run mode) + regression tests |
| `.github/workflows/release.yml` | push to `main` with version tag `v*` | Bump version, build changelog, create GitHub Release |
| `.github/workflows/lint-prompts.yml` | Extend existing | Add: semantic section drift check (compare section headings to previous version) |

**`test.yml` spec:**
- Matrix: Node.js 18, Node.js 20, Node.js 22
- Steps: `npm ci` in `cli/` and `babok-mcp/`, then `npm test` at root
- Upload test results as artifact on failure
- Fail fast: `false` (run all matrix combos)

**`e2e.yml` spec:**
- Uses `evaluation/benchmarks/run_benchmark.js` with `--dryRun` flag
- Runs all three case studies
- Stores results in `evaluation/benchmarks/results/` and commits them back (only on scheduled runs, not PRs)
- Fails if any case scores < 70 overall

**`release.yml` spec:**
- Reads `VERSION` file
- Runs `npm version` in `cli/` and `babok-mcp/`
- Updates `CHANGELOG.md` from PR titles merged since last tag
- Creates GitHub Release with release notes

**Definition of Done**

- [ ] `test.yml` runs on all PRs; fails if any test fails; passes matrix of Node 18/20/22.
- [ ] `e2e.yml` runs on merge to `main`; fails if benchmark score < 70.
- [ ] `release.yml` creates GitHub Release with changelog on version tag push.
- [ ] `lint-prompts.yml` extended: new step that diffs section headings in stage prompt files against the previous commit; fails if a required section is removed.
- [ ] All workflows have `timeout-minutes` set to prevent runaway jobs.
- [ ] Workflow secrets documented in `.github/workflows/README.md`.
- [ ] Badge links for test status, lint status added to root `README.md`.

**Test Plan — F6-T2**

| # | Test | Method | Expected Result |
|---|------|--------|-----------------|
| T1 | Push a PR that breaks one unit test | Manual trigger | `test.yml` fails; PR blocked |
| T2 | Push a PR that introduces a passing test | Manual trigger | `test.yml` passes on all 3 Node versions |
| T3 | Merge to `main`; `e2e.yml` runs | Observe GitHub Actions | Workflow completes; benchmark results committed |
| T4 | Push tag `v2.2.0`; `release.yml` runs | Observe GitHub Actions | GitHub Release created with correct tag and body |
| T5 | Remove a required section from a stage prompt file in a PR | Manual trigger | `lint-prompts.yml` fails on the section drift step |
| T6 | Add a new section (not removing any); push PR | Manual trigger | `lint-prompts.yml` passes |

---

## Implementation Phases & Task Dependencies

```
PHASE 1 — Foundation (Weeks 1–6)
  F6-T1  Test Suite                    ← no dependencies; start immediately
  F3-T1  Quality Scorer                ← depends on: nothing (reads existing rubric JSON)
  F1-T3  Cross-Stage Validator         ← depends on: F3-T1 (shares fixture artefacts)
  F6-T2  CI/CD Enhancement            ← depends on: F6-T1

PHASE 2 — Reasoning Superiority (Weeks 5–10, overlaps with Phase 1 tail)
  F1-T1  Debate Pattern                ← depends on: F6-T1 (needs mock LLM helper)
  F1-T2  Chain-of-Verification         ← depends on: F6-T1
  F3-T2  Gold Standard Suite           ← depends on: F3-T1 (scorer used in benchmark)

PHASE 3 — Knowledge & Orchestration (Weeks 9–16)
  F2-T1  Knowledge Base               ← depends on: nothing
  F4-T1  Orchestrator Engine          ← depends on: F1-T1, F1-T2, F6-T1
  F4-T2  Quality Audit Loop           ← depends on: F4-T1, F3-T1

PHASE 4 — Accessibility & Scale (Weeks 15–22)
  F2-T2  Document Ingestion           ← depends on: F2-T1 (knowledge base for tagging)
  F5-T1  Web UI MVP                   ← depends on: F4-T1 (orchestrator powers the backend)
  F5-T2  Visual Process Mapping       ← depends on: F5-T1 (renders in web UI)
```

**Critical path:** F6-T1 → F1-T1/F1-T2 → F4-T1 → F5-T1

---

## Conventions Used in This Document

| Convention | Meaning |
|------------|---------|
| `F<n>-T<m>` | Filar n, Task m — unique task identifier |
| **Phase N** | Implementation phase; phases may overlap |
| `cli/src/…` | Path relative to repository root |
| `babok-mcp/src/…` | Path relative to repository root |
| **DoD** | Definition of Done — all items must be checked before the task is considered complete |
| `dryRun` | Mode where LLM calls are replaced with deterministic mock responses |
| Mock LLM | `tests/helpers/mock-llm.js` — returns deterministic strings; tracks call history |

---

*Document maintained by the BABOK ANALYST core team. Update task status by tracking in GitHub Issues using the `F<n>-T<m>` identifiers as issue labels.*
