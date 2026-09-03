# STAGE 5: RISK, GOVERNANCE & CHANGE READINESS

**Profile:** consulting
**Practice Area:** Risk & Change Management
**Model Tier:** Standard Mode
**Estimated Duration:** 45–60 minutes active work + risk workshop

**CLI Command:** `babok approve <id> 5` — marks Stage 5 as approved and advances to Stage 6
**CLI Reject:** `babok reject <id> 5 -r "reason"` — rejects Stage 5 with reason

---

## Objectives

1. Register operational, adoption, governance, financial and external risks of the roadmap, each with likelihood, impact, severity, named owner, mitigation and target date
2. Assess change readiness per stakeholder group (ADKAR) and translate Low readiness in high-power groups into adoption risks
3. Fix the governance & escalation cadence that owns risks after the engagement — reusing the Stage 1 steering committee by name
4. Produce the mitigation-owner view

## Prerequisites

- Stage 4 approved (roadmap, change plan)
- If `babok run` executed `stage5_initial_risk_scan` in parallel with Stage 2, use its output as the starting register

## Process

### Step 5.1: Risk Identification

**Agent action (before asking):** From the roadmap (`CH-NNN`, `DP-NN`) and change plan draft the risk register (`R-NNN`: cause → event → consequence; category; likelihood; impact; severity = L × I: Critical ≥ 12, High 6–11, Medium 3–5, Low 1–2).

📋 **STAGE 5 — QUESTION 1/3**

**Category:** Risk Register

Here is the draft register: [present]. Please:
1. Adjust likelihood / impact where your experience differs.
2. Add risks from previous change initiatives in this organisation that failed or stalled.
3. For every Critical/High risk, name the **individual** who will own it (not a department).

**Please answer. I will proceed to question 2/3.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded.*

---

### Step 5.2: Change Readiness

**Evidence:**
- Stage 1 stakeholder stance; Stage 4 change plan; knowledge: change_readiness_benchmarks, resistance_patterns

📋 **STAGE 5 — QUESTION 2/3**

**Category:** Change Readiness

For each stakeholder group, score 1–5: Awareness, Desire, Knowledge, Ability, Reinforcement — or tell me what evidence (survey, interviews) we can use to score. How many other change initiatives hit the same groups in the next 12 months?

**Please answer. I will proceed to question 3/3.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded. Agent action: readiness table; every Low-readiness High-power group becomes an Adoption risk rated ≥ High with the group's manager as owner.*

---

### Step 5.3: Governance & Escalation

📋 **STAGE 5 — QUESTION 3/3**

**Category:** Governance Cadence

Confirm the steering committee from Stage 1 (**[name]**) will own the risk register during implementation. What are the escalation triggers (e.g. any Critical risk, milestone slip > 4 weeks, readiness < 2 in a High-power group)? How often is the register reviewed, and by whom, after the engagement ends?

**This is the last question for Stage 5.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *All 3 questions answered. Generating Stage 5 deliverable...*

---

## Deliverable Template

**Single source of truth:** `profiles/consulting/templates/stages/STAGE_05_Risk_Change_Readiness.md` (+ module `Change_Readiness_Assessment.md`)

Load before writing: MCP `babok_get_stage_template` with `stage_n: 5` and the `project_id`.

**Critical:** Keep all H2 headings unchanged. Every Critical/High row in **Risk Register** must contain a named owner (First Last) and a date — checked by the `CRITICAL-RISK-OWNER` rule.

---

## Quality Checklist

- [ ] Every Critical/High risk has a named individual owner and a dated mitigation
- [ ] Readiness scored per group, weakest ADKAR element named
- [ ] Steering committee name matches Stage 1 verbatim
- [ ] Escalation triggers are numeric / observable
- [ ] Adoption risks reference the Stage 4 change plan
- [ ] No unowned risks

---

**Next Stage:** STAGE 6 — Business Case & Value Realization Plan
