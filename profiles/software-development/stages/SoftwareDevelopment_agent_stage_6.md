# STAGE 6: OUTCOME & CONTEXT RECONCILIATION

**Profile:** software-development
**Practice Area:** Outcome Verification & Context Update
**Model Tier:** Standard Mode
**Estimated Duration:** 15–25 minutes active work (may remain open pending real deployment/KPI data)
**Prerequisite:** Stage 5 Release & Operational Readiness approved

**CLI Command:** `babok approve <id> 6` — marks Stage 6 as approved (initiative complete)
**CLI Reject:** `babok reject <id> 6 -r "reason"` — rejects Stage 6 with reason

---

## Purpose

Stage 6 closes the initiative by recording what was **actually** deployed (not merely merged or planned), what the outcome metrics actually show, and what should change in the product's trwały baseline as a result. If deployment or outcome data is not yet available, this stage stays open and reports that explicitly rather than inventing a result. Approving this stage never silently overwrites the Stage 1 baseline used by other initiatives — any proposed context update is itself a reviewable change.

---

## Objectives

1. Record actual deployment status: environment, date, commit/version, and source of that confirmation
2. Compare planned KPIs (from Stage 0/4) to actual measured outcomes, with data source and measurement window
3. Note any deviation between the plan and what was actually delivered, and why
4. Propose the specific baseline updates this initiative implies for the product's Stage 1 context
5. Flag any other in-flight initiative against the same product that the outcome or baseline update may affect

---

## Process

### Step 6.1: Deployment Confirmation

📋 **STAGE 6 — QUESTION 1/3**

**Category:** Deployment Evidence

What is the actual deployment status of this change? State environment, date, and the commit/version deployed, and how this was confirmed (platform deployment record, release, or an explicit statement from you). If not yet deployed, say so — this stage will stay open.

**Please answer. I will proceed to question 2/3.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded: [summarise deployment status and evidence source]*

---

### Step 6.2: Outcome Measurement

📋 **STAGE 6 — QUESTION 2/3**

**Category:** KPI Outcome

For each KPI defined in Stage 0/4, what is the measured value, its data source, and the measurement window? If data is not yet available, state that explicitly per KPI rather than estimating.

**Please answer. I will proceed to question 3/3.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded: [summarise KPI outcomes or pending status]*

---

### Step 6.3: Baseline Update and Related Initiatives

📋 **STAGE 6 — QUESTION 3/3**

**Category:** Context Update

Based on what was actually delivered, here is the proposed update to the product's Stage 1 baseline: [state the specific sections/facts to update]. Confirm this update, or tell me what to change. Also confirm whether any other initiative against this product should be notified that this baseline changed.

**This is the last question for Stage 6.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *All 3 questions answered. Generating Stage 6 Outcome & Context Reconciliation...*

---

## Deliverable Template

**Single source of truth:** `profiles/software-development/templates/stages/STAGE_06_Outcome_Context_Reconciliation.md`

Load before writing the deliverable:
- MCP: `babok_get_stage_template` with `stage_n: 6` and the `project_id`
- CLI/file: read the template path above

**Critical:** Keep all H2 headings from the template unchanged so `babok score` completeness checks pass.

---

## Go / No-Go Check

Before presenting the reconciliation for approval, verify:

- [ ] Deployment status is stated with evidence, or explicitly marked not yet deployed
- [ ] Every planned KPI has a measured value with source and window, or is explicitly marked pending
- [ ] Any deviation between plan and actual delivery is named, not glossed over
- [ ] The proposed baseline update is specific enough to apply to Stage 1 as a reviewable change
- [ ] Related initiatives against the same product that may be affected are named, or none is confirmed

If any item is unchecked, flag it to the human before proceeding.

---

**Initiative Status:** Approving this stage completes the software-development initiative for this change.
