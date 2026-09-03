# STAGE 3: STRATEGIC OPTIONS & RECOMMENDATION

**Profile:** consulting
**Practice Area:** Strategy Formulation
**Model Tier:** DEEP ANALYSIS MODE
**Estimated Duration:** 60–90 minutes active work + option workshop with the steering committee

**CLI Command:** `babok approve <id> 3` — marks Stage 3 as approved and advances to Stage 4
**CLI Reject:** `babok reject <id> 3 -r "reason"` — rejects Stage 3 with reason

---

## Why Deep Analysis Mode

- Options must be genuinely different paths, not variants of one idea
- Weighted scoring must be defensible criterion by criterion and robust to sensitivity
- The recommendation is the decision the sponsor asked for in Stage 0 — it must be unambiguous

```
[DEEP ANALYSIS MODE ACTIVATED]
Reasoning: Stage 3 requires multi-criteria option evaluation, sensitivity analysis and a
           single defensible recommendation traceable to Stage 2 root causes
Context: Stage 2 root-cause register and value at stake, Stage 0 budget ceiling and target
         date, Stage 1 stakeholder stance
```

---

## Mandate Guardrail

Options describe **business change** — roles, process design, decision rights, incentives, sourcing, organisation. An option is never "implement system X". If a root cause seems to need technology, the option is the business capability (e.g. "single order-intake ownership with a defined information standard"), and the technology question is logged as an open question for a separate initiative.

---

## Objectives

1. Generate at least three distinct options plus the do-nothing baseline (`OPT-00`), each mapped to the root causes it addresses
2. Agree evaluation criteria and weights (sum 100) with the steering committee, each weight sourced
3. Score every option, rank, and test sensitivity
4. Recommend one option by its `OPT-NN` identifier with Short Rationale + Evidence
5. Quantify the risks of inaction

## Prerequisites

- Stage 2 approved (root-cause register, value at stake)

## Process

### Step 3.1: Option Generation

**Agent action (before asking):** From the Stage 2 root-cause register, draft 3–5 options spanning quick-win, structural and transformational types. For each: what changes in people / process / governance, which `RC-NNN` it resolves.

📋 **STAGE 3 — QUESTION 1/4**

**Category:** Option Generation

Here are my draft options: [present `OPT-01…OPT-0N` with root causes addressed]. Please:
1. Add any option leadership has already discussed, even informally.
2. Tell me which options are politically or contractually impossible, and why (they stay in the matrix as "considered and discarded").

**Please answer. I will proceed to question 2/4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded. Agent action: finalise option list; every option references its RC-NNN.*

---

### Step 3.2: Evaluation Criteria

**Assumptions:**
- Default criteria: value captured, time to first benefit, cost vs. budget ceiling, adoption risk, strategic fit
- Weights reflect the sponsor's mandate, not the consultant's preference

📋 **STAGE 3 — QUESTION 2/4**

**Category:** Criteria & Weights

Proposed criteria and weights: [present `CR-NN` table]. Would the sponsor and steering committee weight these differently? Is any criterion missing (e.g. regulatory exposure, customer impact, employee impact)?

**Please answer. I will proceed to question 3/4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded. Agent action: lock weights (sum = 100) with source of each weight.*

---

### Step 3.3: Scoring and Sensitivity

**Agent action (before asking):** Score every option 1–5 per criterion with one line of evidence per cell; compute weighted scores; rank; rerun with the top weight halved.

📋 **STAGE 3 — QUESTION 3/4**

**Category:** Scoring Validation

Here is the Options Evaluation Matrix and the sensitivity result: [present]. Which scores do you disagree with, and on what evidence? Does the ranking match the steering committee's intuition — if not, what are we missing?

**Please answer. I will proceed to question 4/4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded.*

---

### Step 3.4: Risks of Inaction

📋 **STAGE 3 — QUESTION 4/4**

**Category:** Risks of Inaction

If nothing changes (OPT-00) over the next 12–24 months, what happens to cost, customers, people and compliance? Any known deadlines or external events (contract renewals, regulation, competitor moves) that make inaction costlier?

**This is the last question for Stage 3.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *All 4 questions answered. Generating Stage 3 deliverable...*

---

## Deliverable Template

**Single source of truth:** `profiles/consulting/templates/stages/STAGE_03_Strategic_Options.md` (+ module `Options_Evaluation_Matrix.md`)

Load before writing: MCP `babok_get_stage_template` with `stage_n: 3` and the `project_id`.

**Critical:** Keep all H2 headings unchanged so `babok score` completeness checks pass. The section **Recommended Option & Rationale** must name exactly one `OPT-NN` — Stage 4 and the `RECOMMENDATION-TRACEABILITY` rule depend on it.

---

## Quality Checklist

- [ ] ≥ 3 options plus OPT-00, each mapped to RC-NNN
- [ ] Weights sum to 100; every weight has a source
- [ ] Every score cell defensible with evidence
- [ ] Sensitivity stated; recommendation robustness declared
- [ ] Recommendation names one OPT-NN and its score vs. runner-up
- [ ] Risks of inaction quantified with timeframe
- [ ] No option is a system implementation

---

**Next Stage:** STAGE 4 — Target Operating Model & Change Roadmap
