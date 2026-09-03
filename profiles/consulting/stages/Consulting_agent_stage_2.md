# STAGE 2: CURRENT STATE DIAGNOSTIC & ROOT CAUSE ANALYSIS

**Profile:** consulting
**Practice Area:** Operating Model Diagnostic
**Model Tier:** DEEP ANALYSIS MODE
**Estimated Duration:** 60–90 minutes active work + 1–2 weeks of data collection and interviews

**CLI Command:** `babok approve <id> 2` — marks Stage 2 as approved and advances to Stage 3
**CLI Reject:** `babok reject <id> 2 -r "reason"` — rejects Stage 2 with reason

---

## Why Deep Analysis Mode

- Root causes must be separated from symptoms across people, process, governance, information and culture
- Value-at-stake sizing requires triangulating partial data with explicit assumptions
- The diagnostic determines every later stage; errors here propagate

```
[DEEP ANALYSIS MODE ACTIVATED]
Reasoning: Stage 2 combines operating-model description, KPI baselining, 5-Whys / Fishbone
           root-cause analysis and value sizing — complex synthesis task
Context: Stage 0 mandate & exclusions, Stage 1 KPIs and stakeholders, injected frameworks
         (7S, Value Chain, DMAIC) and industry benchmarks
```

---

## Mandate Guardrail

Existing systems are described **only as AS-IS context** ("Systems & Information"). Do not propose, evaluate or hint at software changes, vendors or system requirements in this stage. If a finding is "the system cannot do X", record the *business* consequence and the *process/governance* workaround, not a system fix.

---

## Objectives

1. Describe the current operating model: people & organisation, process, governance & decision rights, systems & information (context)
2. Measure the KPI baseline for every Stage 1 KPI, or record an explicit data gap
3. Register findings with evidence and quantified impact
4. Derive root causes (5-Whys, Fishbone) and rate confidence
5. Size the value at stake per root cause with a basis of estimate

## Prerequisites

- Stage 1 approved (stakeholders, KPIs, governance)

## Process

### Step 2.1: Operating Model Walk-through

**Assumptions:**
- The end-to-end process crosses several units; hand-offs are where waste and delay concentrate
- Decision rights on paper differ from decision rights in practice

**Evidence:**
- Stage 0 in-scope functions; Stage 1 stakeholder map
- Framework lens: McKinsey 7S / Value Chain (if injected)

📋 **STAGE 2 — QUESTION 1/4**

**Category:** Current Operating Model

Walk me through how the in-scope work actually gets done today, end to end:
1. Which units and roles are involved, roughly how many FTE each?
2. Where are the hand-offs between units, and what is passed (document, approval, data)?
3. Which decisions slow the process down, who takes them, and in which forum?
4. Which systems or spreadsheets do people use along the way? (context only)

**Please answer. I will proceed to question 2/4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded. Agent action: populate the Operating Model Canvas, assign `PR-NNN` to processes.*

---

### Step 2.2: KPI Baseline

📋 **STAGE 2 — QUESTION 2/4**

**Category:** KPI Baseline

For each Stage 1 KPI (list them), what is the measured current value, over which period, from which source? Where no measurement exists, tell me what data *is* available so we can estimate — and I will mark the baseline as an explicit data gap with confidence Low.

**Please answer. I will proceed to question 3/4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded. Agent action: KPI Baseline table with unit, period, source, confidence.*

---

### Step 2.3: Findings and Root Causes

**Agent action (before asking):** From Steps 2.1–2.2 draft the finding register (`F-NNN`: symptom, evidence, affected process, frequency, quantified impact). For each High-impact finding run 5-Whys; group causes on a Fishbone (People / Process / Governance / Information / Culture / External). Propose the root-cause register (`RC-NNN`) — one root cause should explain several findings.

📋 **STAGE 2 — QUESTION 3/4**

**Category:** Root Cause Validation

Here is my draft finding register and root-cause register: [present tables]. Please:
1. Correct any finding whose impact or frequency is wrong.
2. For each root cause: agree / disagree / "that is still a symptom, the real cause is ___".
3. Name any root cause I have missed that people talk about informally.

**Please answer. I will proceed to question 4/4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded. Agent action: finalise root-cause register with confidence (High = measured, Medium = triangulated interviews, Low = single source).*

---

### Step 2.4: Value at Stake

📋 **STAGE 2 — QUESTION 4/4**

**Category:** Value-at-Stake Sizing

To size the value of resolving each root cause I need: fully loaded hourly/FTE cost for the affected roles, transaction volumes, and any known cost of errors, delays or lost revenue. Which of these can you provide or confirm as estimates?

**This is the last question for Stage 2.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *All 4 questions answered. Generating Stage 2 deliverable...*

---

## Deliverable Template

**Single source of truth:** `profiles/consulting/templates/stages/STAGE_02_Current_State_Diagnostic.md` (+ modules `Operating_Model_Canvas.md`, `Root_Cause_Fishbone_Template.md`)

Load before writing: MCP `babok_get_stage_template` with `stage_n: 2` and the `project_id`.

**Critical:** Keep all H2 headings unchanged so `babok score` completeness checks pass.

---

## Quality Checklist

- [ ] Every Stage 1 KPI has a numeric baseline or an explicit data gap
- [ ] Every finding cites evidence and a quantified impact
- [ ] Every root cause explains ≥ 1 finding and carries a confidence level
- [ ] Value at stake is numeric per root cause with a basis of estimate and stated assumptions
- [ ] Systems appear only as context — no solution or vendor language
- [ ] Every conclusion follows Short Rationale + Evidence

---

**Next Stage:** STAGE 3 — Strategic Options & Recommendation
