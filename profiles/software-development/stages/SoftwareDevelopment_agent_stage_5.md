# STAGE 5: RELEASE & OPERATIONAL READINESS

**Profile:** software-development
**Practice Area:** Release Management
**Model Tier:** Standard Mode
**Estimated Duration:** 20–30 minutes active work
**Prerequisite:** Stage 4 Implementation & Verification Plan approved. If implementation was authorised and has run, this stage reviews its actual results; if not, it plans readiness ahead of a future execution/authorisation.

**CLI Command:** `babok approve <id> 5` — marks Stage 5 as approved and advances to Stage 6
**CLI Reject:** `babok reject <id> 5 -r "reason"` — rejects Stage 5 with reason

---

## Purpose

Stage 5 establishes whether the change is actually ready to release: real verification evidence (not a promise of tests), migration and rollback plans, monitoring, and a risk register with named owners. A pull/merge request being open, or CI passing, is evidence to record — it is not, by itself, a statement that the change is ready or live. Merge and deployment remain actions the human takes on the hosting platform; this stage documents readiness and risk, it does not perform them.

---

## Objectives

1. Record actual verification results (tests run, environment, pass/fail) for the implemented change, or state explicitly that implementation has not yet been authorised/run
2. Confirm the migration and rollback plan for anything the change alters
3. Define monitoring/observability signals that will confirm the change works after release
4. Maintain a Risk Register with a named owner and mitigation date for every Critical/High risk
5. State the pull/merge request status and what remains a human decision (merge, deploy)

---

## Process

### Step 5.1: Verification Evidence

📋 **STAGE 5 — QUESTION 1/3**

**Category:** Verification Status

What is the current state of implementation and verification for this change? If tests/builds have been run (locally or in CI), state where, which commands, and the pass/fail result. If nothing has been executed yet, confirm that explicitly rather than assuming a future pass.

**Please answer. I will proceed to question 2/3.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded: [summarise verification status]*

---

### Step 5.2: Migration, Rollback and Monitoring

📋 **STAGE 5 — QUESTION 2/3**

**Category:** Operational Readiness

Confirm or correct: the migration/rollback approach from Stage 4 still applies, and here are the proposed monitoring signals that would show the change is working after release: [list signals]. Any additional signal, alert or on-call owner to add?

**Please answer. I will proceed to question 3/3.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded: [confirm or update migration/rollback/monitoring]*

---

### Step 5.3: Release Decision Status

📋 **STAGE 5 — QUESTION 3/3**

**Category:** Release Decision

State the current pull/merge request status (draft / open / approved / not yet created) and confirm: merge and deployment remain your decision on the hosting platform, not an automated action of this initiative.

**This is the last question for Stage 5.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *All 3 questions answered. Generating Stage 5 Release & Operational Readiness...*

---

## Deliverable Template

**Single source of truth:** `profiles/software-development/templates/stages/STAGE_05_Release_Operational_Readiness.md`

Load before writing the deliverable:
- MCP: `babok_get_stage_template` with `stage_n: 5` and the `project_id`
- CLI/file: read the template path above

**Critical:** Keep all H2 headings from the template unchanged so `babok score` completeness checks pass.

---

## Go / No-Go Check

Before presenting the readiness review for approval, verify:

- [ ] Verification evidence states what actually ran, where, and its result — or explicitly states nothing has run yet
- [ ] Every Critical/High risk in the Risk Register has a named owner and a target mitigation date
- [ ] Migration and rollback plans are concrete, not "reversible if needed"
- [ ] Monitoring signals are specific and tied to this change's expected effect
- [ ] Merge/deployment are recorded as pending human decisions, never as completed by this initiative

If any item is unchecked, flag it to the human before proceeding.

---

**Next Stage:** STAGE 6 — Outcome & Context Reconciliation
