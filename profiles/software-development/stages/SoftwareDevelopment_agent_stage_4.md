# STAGE 4: IMPLEMENTATION & VERIFICATION PLAN

**Profile:** software-development
**Practice Area:** Delivery Planning
**Model Tier:** Standard Mode
**Estimated Duration:** 20–30 minutes active work
**Prerequisite:** Stage 3 Options & Architecture Decisions approved

**CLI Command:** `babok approve <id> 4` — marks Stage 4 as approved and advances to Stage 5
**CLI Reject:** `babok reject <id> 4 -r "reason"` — rejects Stage 4 with reason

---

## Purpose

Stage 4 turns the Stage 3 recommendation into a concrete, testable backlog with acceptance criteria, an effort/cost estimate, a roadmap, and a verification plan — the package a human can separately authorise for implementation. **Approving this stage freezes the plan; it is not, by itself, authorisation to execute code, run the repository's own scripts/tests, or publish a pull/merge request.** That authorisation is requested explicitly and separately, and is recorded in this deliverable's Execution Authorisation Status section as a distinct decision.

---

## Objectives

1. Decompose the Stage 3 recommendation into functional requirements/backlog items (`FR-NNN`) with acceptance criteria
2. Build a Requirements Traceability Matrix linking every `FR-NNN` to the `ADR-NN` and affected component it implements
3. Name every integration point / contract that must be updated or kept compatible
4. Produce an effort/cost estimate and compare it to the Stage 0 budget ceiling
5. Produce a phased roadmap with dated milestones and a verification/test plan
6. Record the current execution-authorisation status as a distinct, separate decision from stage approval

---

## Process

### Step 4.1: Backlog and Acceptance Criteria

📋 **STAGE 4 — QUESTION 1/3**

**Category:** Backlog Scope

Based on the Stage 3 recommendation, here is the proposed backlog: [list draft `FR-NNN` items]. Please confirm this is the right level of granularity, or tell me which items to split, merge, or drop.

**Please answer. I will proceed to question 2/3.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded: [summarise confirmed backlog]*

---

### Step 4.2: Effort Ceiling and Release Window Check

📋 **STAGE 4 — QUESTION 2/3**

**Category:** Budget & Roadmap Confirmation

Here is the effort/cost estimate and proposed roadmap against the Stage 0 budget ceiling and target release window: [state the numbers and dates]. Please confirm these still hold, or state the updated ceiling/window.

**Please answer. I will proceed to question 3/3.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded: [confirm or update budget/roadmap]*

---

### Step 4.3: Execution Authorisation

📋 **STAGE 4 — QUESTION 3/3**

**Category:** Execution Authorisation (separate from plan approval)

Approving this plan does **not** authorise running the analysed repository's own code/tests or publishing a pull/merge request. Do you separately authorise, for this initiative only:

1. Running the plan's tests/build locally or in an available isolated environment? (yes/no — if yes, state which commands/directories are permitted)
2. Preparing a branch and pull/merge request for human review (never auto-merged, never deployed)? (yes/no)

If either is "no" for now, the plan is still recorded as approved once you approve this stage; execution simply waits for a later, explicit authorisation.

**This is the last question for Stage 4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *All 3 questions answered. Generating Stage 4 Implementation & Verification Plan...*

---

## Deliverable Template

**Single source of truth:** `profiles/software-development/templates/stages/STAGE_04_Implementation_Verification_Plan.md`

Load before writing the deliverable:
- MCP: `babok_get_stage_template` with `stage_n: 4` and the `project_id`
- CLI/file: read the template path above

**Critical:** Keep all H2 headings from the template unchanged so `babok score` completeness checks pass.

---

## Go / No-Go Check

Before presenting the plan for approval, verify:

- [ ] Every `FR-NNN` has an acceptance criterion and appears in the Requirements Traceability Matrix
- [ ] Every integration point/contract affected is named with its update or compatibility approach
- [ ] The effort/cost estimate is compared explicitly to the Stage 0 budget ceiling
- [ ] The roadmap has dated milestones and an owner for each phase
- [ ] Execution Authorisation Status reflects exactly what the human authorised in Step 4.3 — no more, no less

If any item is unchecked, flag it to the human before proceeding.

---

**Next Stage:** STAGE 5 — Release & Operational Readiness
