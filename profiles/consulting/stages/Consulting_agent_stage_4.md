# STAGE 4: TARGET OPERATING MODEL & CHANGE ROADMAP

**Profile:** consulting
**Practice Area:** Operating Model Design & Change Management
**Model Tier:** Standard Mode
**Estimated Duration:** 60–90 minutes active work + design workshop

**CLI Command:** `babok approve <id> 4` — marks Stage 4 as approved and advances to Stage 5
**CLI Reject:** `babok reject <id> 4 -r "reason"` — rejects Stage 4 with reason

---

## Mandate Guardrail

The Target Operating Model describes the future **business** model: roles, structure, process ownership, decision rights, performance management and *business* information needs. It does not design systems, select vendors or write requirements. The "Information & Enablers" row states what information must flow between whom and when — nothing more.

---

## Objectives

1. Design the Target Operating Model that implements the recommended `OPT-NN`, dimension by dimension, resolving the Stage 2 root causes
2. Specify capability and organisation-design changes (`CH-NNN`) with FTE and skills impact
3. Build a phased roadmap (quick wins / mid-term / long-term) with dated, measurable milestones and owners, completing no later than the Stage 0 target date
4. Write the change-management plan (ADKAR / Kotter) per stakeholder group
5. Map dependencies and the critical path

## Prerequisites

- Stage 3 approved (recommended option `OPT-NN`)

## Process

### Step 4.1: Target Model by Dimension

**Agent action (before asking):** Fill the Operating Model Canvas for the target state: for each dimension (People & Organisation, Process, Governance & Decision Rights, Performance Management, Information & Enablers, Culture) — current state (Stage 2), target state, root causes resolved (`RC-NNN`). State the implemented option `OPT-NN` at the top.

📋 **STAGE 4 — QUESTION 1/4**

**Category:** Target Operating Model

Here is the draft target model implementing **OPT-NN**: [present canvas]. Please react per dimension: realistic / too ambitious / not ambitious enough — and name any constraint (union agreements, legal entity boundaries, headcount freeze) I must design around.

**Please answer. I will proceed to question 2/4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded.*

---

### Step 4.2: Capability & Org Design Changes

📋 **STAGE 4 — QUESTION 2/4**

**Category:** Organisation Design

For the changes I have listed (`CH-NNN`: new / modified / retired roles, structural moves, capability builds), please confirm the FTE impact and tell me which changes require HR, works-council or legal processes and their typical lead time.

**Please answer. I will proceed to question 3/4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded.*

---

### Step 4.3: Phased Roadmap

**Assumptions:**
- Quick wins (0–3 months) exist and build credibility for structural change
- Roadmap completion must not exceed the Stage 0 target date without steering approval

📋 **STAGE 4 — QUESTION 3/4**

**Category:** Roadmap & Sequencing

Proposed phasing: [present quick wins / mid-term / long-term with CH-IDs, milestones, dates]. Which fixed dates in the organisation's calendar (budget cycle, peak season, system freezes, board meetings) must the roadmap respect? Which dependencies (`DP-NN`) could block a phase?

**Please answer. I will proceed to question 4/4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded. Agent action: finalise roadmap with owners, dependencies, critical path.*

---

### Step 4.4: Change Management Plan

**Evidence:**
- Stage 1 stakeholder stance; knowledge: ADKAR, Kotter, resistance patterns (if injected)

📋 **STAGE 4 — QUESTION 4/4**

**Category:** Change Management

For each stakeholder group from Stage 1: where do you see the biggest gap — Awareness, Desire, Knowledge, Ability or Reinforcement? Which visible actions is the sponsor prepared to commit to per phase? Which quick win would most convince sceptics?

**This is the last question for Stage 4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *All 4 questions answered. Generating Stage 4 deliverable...*

---

## Deliverable Template

**Single source of truth:** `profiles/consulting/templates/stages/STAGE_04_Target_Operating_Model.md` (+ modules `Operating_Model_Canvas.md`, `Change_Readiness_Assessment.md`)

Load before writing: MCP `babok_get_stage_template` with `stage_n: 4` and the `project_id`.

**Critical:** Keep all H2 headings unchanged. The **Target Operating Model Design** section must name the implemented `OPT-NN` from Stage 3 (`RECOMMENDATION-TRACEABILITY` rule); the **Phased Roadmap** completion date is checked against the Stage 0 target date (`ROADMAP-DATE` rule).

---

## Quality Checklist

- [ ] TOM names the implemented OPT-NN
- [ ] Every dimension maps current → target → RC-NNN resolved
- [ ] Every CH-NNN has type, units affected, FTE impact, skills
- [ ] Every phase has dated, measurable milestone and owner; completion ≤ Stage 0 target date
- [ ] Change plan covers every High-power group with its weakest ADKAR element
- [ ] Dependencies and critical path stated
- [ ] No system implementation or vendor selection

---

**Next Stage:** STAGE 5 — Risk, Governance & Change Readiness
