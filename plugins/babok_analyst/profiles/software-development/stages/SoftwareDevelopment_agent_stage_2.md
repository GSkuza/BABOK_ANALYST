# STAGE 2: CHANGE IMPACT & GAP ANALYSIS

**Profile:** software-development
**Practice Area:** Impact Analysis
**Model Tier:** Deep Analysis Mode
**Estimated Duration:** 20–35 minutes active work
**Prerequisite:** Stage 1 Product & Repository Baseline approved

**CLI Command:** `babok approve <id> 2` — marks Stage 2 as approved and advances to Stage 3
**CLI Reject:** `babok reject <id> 2 -r "reason"` — rejects Stage 2 with reason

---

## Purpose

Stage 2 compares the Stage 0 desired outcome against the Stage 1 baseline to determine exactly what must change: current behaviour, desired behaviour, the components/contracts/data affected, and the risks of making the change. It grounds every affected item in the Stage 1 evidence rather than re-describing the product from scratch.

---

## Objectives

1. Restate the change goal in terms of current vs. desired behaviour, each citing Stage 1 evidence
2. Enumerate every affected component, API/contract, data store and cross-repository dependency
3. Size the gap: what exists, what is missing, what must be modified or removed
4. Identify regression, compatibility and data-migration risks created by the change
5. Confirm the change goal and constraints from Stage 0 are still accurate before proceeding to option design

---

## Process

### Step 2.1: Current vs. Desired Behaviour

📋 **STAGE 2 — QUESTION 1/3**

**Category:** Behaviour Gap Confirmation

Based on Stage 1 evidence, here is the current behaviour relevant to this change: [cite the specific modules/flows]. Please confirm or correct the **desired** behaviour in concrete, observable terms (what a user or system should see/receive that they don't today).

**Please answer. I will proceed to question 2/3.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded: [summarise confirmed desired behaviour]*

---

### Step 2.2: Constraints and Non-Negotiables

📋 **STAGE 2 — QUESTION 2/3**

**Category:** Constraints

Are there any constraints not yet captured in Stage 0 that must hold for this change (e.g. a contract that external consumers depend on, a data field that cannot change type, a compliance rule)? If none, confirm explicitly.

**Please answer. I will proceed to question 3/3.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded: [summarise additional constraints, or "none"]*

---

### Step 2.3: Risk Appetite for This Specific Change

📋 **STAGE 2 — QUESTION 3/3**

**Category:** Risk Tolerance

Given the affected components identified from Stage 1 evidence, is there any component or data store where a regression would be especially costly (e.g. billing, authentication, regulated data)? Name it explicitly so Stage 3 options can weigh it.

**This is the last question for Stage 2.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *All 3 questions answered. Generating Stage 2 Change Impact & Gap Analysis...*

---

## Deliverable Template

**Single source of truth:** `profiles/software-development/templates/stages/STAGE_02_Change_Impact_Gap_Analysis.md`

Load before writing the deliverable:
- MCP: `babok_get_stage_template` with `stage_n: 2` and the `project_id`
- CLI/file: read the template path above

**Critical:** Keep all H2 headings from the template unchanged so `babok score` completeness checks pass.

---

## Go / No-Go Check

Before presenting the analysis for approval, verify:

- [ ] Current behaviour cites specific Stage 1 evidence, not a generic restatement
- [ ] Every affected component, contract and data store is named, not just "the backend"
- [ ] Regression and compatibility risks are stated with the component they threaten
- [ ] Any newly raised constraint is recorded and will bind Stage 3 option design

If any item is unchecked, flag it to the human before proceeding.

---

**Next Stage:** STAGE 3 — Options & Architecture Decisions (autonomous)
