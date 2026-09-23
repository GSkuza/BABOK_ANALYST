# STAGE 1: PRODUCT & REPOSITORY BASELINE

**Profile:** software-development
**Practice Area:** Autonomous Product Discovery
**Model Tier:** Deep Analysis Mode
**Estimated Duration:** Autonomous — no scheduled human wait, subject to run limits
**Prerequisite:** Stage 0 Change Charter approved (repositories, host and refs are known)

**CLI Command:** `babok approve <id> 1` — marks Stage 1 as approved and advances to Stage 2
**CLI Reject:** `babok reject <id> 1 -r "reason"` — rejects Stage 1 with reason
**Reopen:** `babok open-revision <id> 1` — after the repository has moved on and this baseline is stale

---

## Purpose

Stage 1 builds the trwały, evidence-backed baseline of the product: what it does for the business, how the code is organised, what its architecture is, and how it is built/tested/released — pinned to the exact commit(s) analysed. This stage does **not** interview the human about technology or architecture; it gathers and verifies evidence directly from the repositories named in the Stage 0 charter, and asks the human only when a business-context fact is both decision-critical and unavailable from any source.

This baseline is reused by later initiatives against the same product: they extend and refresh it rather than rebuilding it.

---

## Objectives

1. Confirm the exact commit (or explicit dirty-tree snapshot) analysed for every repository in scope
2. Reconstruct the **Business** context: purpose, users, domain rules, and prior decisions, from documentation, code and journal history
3. Reconstruct the **Technology** context: modules, entry points, dependencies, data models, APIs and tests, with citations
4. Reconstruct the **Architecture** context: component boundaries, data flow, integration points and quality constraints, distinguishing confirmed-by-code from documentation-only claims
5. Reconstruct the **SDLC** context: build, test, review, branching, release and rollback conventions actually configured in the repository
6. Record every claim's evidence, and every unresolved gap with its impact and confidence

---

## Process (Autonomous Evidence Loop)

This stage runs the following loop for each repository named in the Stage 0 charter, then reconciles findings across repositories that belong to the same product:

1. **Inventory** — enumerate the repository tree at the pinned ref (or the disclosed dirty-tree snapshot); identify manifests, entry points, config, CI/CD definitions, test suites and documentation. Record exclusions (binaries, vendored dependencies, generated artefacts, files above the read budget) explicitly.
2. **Targeted retrieval** — read the specific files, symbols and configuration needed to answer each of the four dimensions above; do not attempt to load the entire repository into one pass.
3. **Synthesis** — draft the four context sections, citing the repository, ref, path and (where applicable) symbol for every non-trivial claim.
4. **Verification** — re-check load-bearing claims against the actual source before finalising; downgrade anything that cannot be confirmed to `Hypothesis` or `Assumption` with a stated confidence.
5. **Cross-repository reconciliation** — when the product spans multiple repositories, state how they relate (API boundary, shared schema, deployment order) and flag any relationship that could not be confirmed from either side.
6. **Gap escalation** — if a **business** fact is both decision-critical for later stages and unavailable from any source (code, docs, journal, prior approvals), ask the human exactly one specific question. Do not ask about anything the repository itself can answer.

There is no scripted question sequence for this stage. If step 6 produces a question, ask it, wait for the answer, incorporate it, and continue the loop — do not re-ask questions already answered in this or a prior approved stage.

---

## Deliverable Template

**Single source of truth:** `profiles/software-development/templates/stages/STAGE_01_Product_Repository_Baseline.md`

Load before writing the deliverable:
- MCP: `babok_get_stage_template` with `stage_n: 1` and the `project_id`
- CLI/file: read the template path above

**Critical:** Keep all H2 headings from the template unchanged so `babok score` completeness checks pass.

---

## Go / No-Go Check

Before presenting the baseline for approval, verify:

- [ ] Every repository in scope has a pinned commit/ref or a disclosed dirty-tree snapshot
- [ ] Business, Technology, Architecture and SDLC sections each cite specific evidence, not just narrative summary
- [ ] Every unverifiable claim is labelled `Hypothesis` or `Assumption` with a confidence level
- [ ] Excluded files/areas and their impact on coverage are disclosed
- [ ] Any human-asked question was genuinely business-owned and not answerable from the repository

If any item is unchecked, flag it to the human before proceeding.

---

**Next Stage:** STAGE 2 — Change Impact & Gap Analysis
