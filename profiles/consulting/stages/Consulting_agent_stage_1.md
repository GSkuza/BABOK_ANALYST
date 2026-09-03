# STAGE 1: STAKEHOLDER & GOVERNANCE MAPPING

**Profile:** consulting
**Practice Area:** Engagement Governance
**Model Tier:** Standard Mode
**Estimated Duration:** 45–60 minutes active work + stakeholder validation

**CLI Command:** `babok approve <id> 1` — marks Stage 1 as approved and advances to Stage 2
**CLI Reject:** `babok reject <id> 1 -r "reason"` — rejects Stage 1 with reason

---

## Objectives

1. Map every stakeholder who decides, influences or is affected, and place them on a power/interest grid
2. Design the governance model: steering committee, decision rights, escalation path
3. Produce the engagement RACI with exactly one Accountable per activity
4. Define success criteria as KPIs with numeric baselines and targets (baselines may be provisional until Stage 2)
5. Agree the communication plan per stakeholder quadrant

## Prerequisites

- Stage 0 approved (sponsor, mandate, scope, budget ceiling, target date)

## Process

### Step 1.1: Stakeholder Identification

**Assumptions:**
- Stakeholders span sponsor level, affected functions and enabling functions (Finance, HR)
- Resistant stakeholders are as important to map as champions

**Evidence:**
- Stage 0: Sponsor, Engagement Owner, in-scope functions

📋 **STAGE 1 — QUESTION 1/4**

**Category:** Stakeholders

For each in-scope function from the charter, who (a) makes decisions, (b) runs the work day to day, (c) is affected but has no formal say? Please list names and titles. Also name anyone you already know is sceptical of the engagement.

**Please answer. I will proceed to question 2/4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded. Agent action: assign `ST-NNN` IDs, rate Power / Interest (H/M/L), record stance (Champion / Neutral / Resistant), place on the grid.*

---

### Step 1.2: Governance Model

📋 **STAGE 1 — QUESTION 2/4**

**Category:** Steering Committee

1. Does a steering committee (or equivalent body) already exist for this topic? If so, its **official name**, members and cadence.
2. If not: which of the high-power stakeholders should sit on it, chaired by the sponsor?
3. Which decisions must be reserved for the committee (deliverable approval, scope/budget change, option selection, roadmap sign-off)?

**Please answer. I will proceed to question 3/4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded. Note: the committee name must be reused verbatim in Stage 5 (validation rule GOVERNANCE continuity).*

---

### Step 1.3: Success Criteria & KPIs

**Assumptions:**
- Success is measurable within the target date from Stage 0
- If a baseline is unknown, it is marked provisional and measured in Stage 2

📋 **STAGE 1 — QUESTION 3/4**

**Category:** Success Criteria

Which 3–6 KPIs will show the engagement succeeded? For each: current value (if known), target value, unit, target date, and where it is measured. Include at least one KPI the sponsor cares about personally.

**Please answer. I will proceed to question 4/4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded. Agent action: assign `KPI-NNN`; flag provisional baselines for Stage 2.*

---

### Step 1.4: Communication Plan

📋 **STAGE 1 — QUESTION 4/4**

**Category:** Communication

How does the organisation prefer to receive engagement communication (steering brief format, town halls, intranet, 1:1s)? Any audiences that must NOT be informed yet (e.g. works council timing, confidentiality)?

**This is the last question for Stage 1.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *All 4 questions answered. Generating Stage 1 deliverable...*

---

## Deliverable Template

**Single source of truth:** `profiles/consulting/templates/stages/STAGE_01_Stakeholder_Governance.md` (+ module `RACI_Governance_Template.md`)

Load before writing: MCP `babok_get_stage_template` with `stage_n: 1` and the `project_id`.

**Critical:** Keep all H2 headings unchanged so `babok score` completeness checks pass.

---

## Quality Checklist

- [ ] Every High-power stakeholder has a named engagement strategy
- [ ] Steering committee has named members, a chair and a fixed cadence
- [ ] Every KPI has numeric baseline (or "provisional") and target with dates
- [ ] RACI has exactly one A per activity
- [ ] Communication plan covers all four grid quadrants
- [ ] Every conclusion follows Short Rationale + Evidence

---

**Next Stage:** STAGE 2 — Current State Diagnostic & Root Cause Analysis
