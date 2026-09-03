# STAGE 6: BUSINESS CASE & VALUE REALIZATION PLAN

**Profile:** consulting
**Practice Area:** Value Management
**Model Tier:** DEEP ANALYSIS MODE
**Estimated Duration:** 60–90 minutes active work + finance validation

**CLI Command:** `babok approve <id> 6` — marks Stage 6 as approved and completes the engagement pipeline
**CLI Reject:** `babok reject <id> 6 -r "reason"` — rejects Stage 6 with reason

---

## Why Deep Analysis Mode

- Costs and benefits must reconcile to Stage 2 value at stake and the Stage 0 budget ceiling
- ROI, payback and NPV need explicit assumptions and a sensitivity case
- The benefits tracker must survive the consultant's departure

```
[DEEP ANALYSIS MODE ACTIVATED]
Reasoning: Stage 6 builds the financial case and the post-engagement value-tracking
           mechanism — quantitative synthesis across Stages 0, 1, 2 and 4
Context: Stage 0 budget ceiling and target date, Stage 1 KPIs, Stage 2 value at stake,
         Stage 4 roadmap and CH-NNN changes, Stage 5 risks
```

---

## Objectives

1. Build the cost-benefit analysis: one-off and recurring costs of the roadmap changes vs. benefits per value lever, over a 3-year horizon
2. Compute ROI, payback, NPV with stated discount rate and a −30% benefits sensitivity
3. Populate the Benefits Realization Tracker: every benefit → Stage 1 KPI → Stage 2 baseline → target → date → lead indicator → client-side owner
4. Compare total cost to the Stage 0 budget ceiling and, if exceeded, present a descoping option
5. Define value-tracking governance and the handover date

## Prerequisites

- Stage 5 approved

## Process

### Step 6.1: Cost Build-up

📋 **STAGE 6 — QUESTION 1/4**

**Category:** Costs

For the roadmap changes (`CH-NNN`), which cost inputs can Finance confirm: internal FTE effort and loaded rates, training / capability build, interim roles or backfill, external support, severance or restructuring provisions? Which discount rate does the organisation use for business cases?

**Please answer. I will proceed to question 2/4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded.*

---

### Step 6.2: Benefits and Phasing

**Agent action (before asking):** From Stage 2 value at stake and the Stage 4 roadmap, phase benefits by year (`B-NNN` → `RC-NNN` → `KPI-NNN`) with a realisation ramp per phase.

📋 **STAGE 6 — QUESTION 2/4**

**Category:** Benefits

Here is the draft benefits schedule: [present]. Which benefits would Finance treat as hard (budget-affecting) vs. soft? Which ramp-up assumptions are too optimistic given the Stage 5 readiness scores?

**Please answer. I will proceed to question 3/4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded. Agent action: financial summary — net benefit, ROI, payback, NPV, sensitivity.*

---

### Step 6.3: Budget Alignment

📋 **STAGE 6 — QUESTION 3/4**

**Category:** Funding & Budget Alignment

Total programme cost is [AMOUNT] against the Stage 0 ceiling of [AMOUNT] ([within / exceeds by X%]). If exceeded: which `CH-NNN` could be deferred, and what benefit is lost? From which budget (opex / capex / departmental) will the changes be funded, and by when must the funding decision be taken?

**Please answer. I will proceed to question 4/4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded.*

---

### Step 6.4: Value Tracking Governance

📋 **STAGE 6 — QUESTION 4/4**

**Category:** Value Tracking

Who on the client side will own the benefits tracker after handover, in which forum will it be reviewed and how often, and what triggers corrective action (e.g. benefit < 70% of plan for two consecutive reviews)? What is the handover date?

**This is the last question for Stage 6.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *All 4 questions answered. Generating Stage 6 deliverable...*

---

## Deliverable Template

**Single source of truth:** `profiles/consulting/templates/stages/STAGE_06_Business_Case_Value.md` (+ module `Benefits_Realization_Tracker.md`)

Load before writing: MCP `babok_get_stage_template` with `stage_n: 6` and the `project_id`.

**Critical:** Keep all H2 headings unchanged. **Cost-Benefit Analysis & ROI/NPV** figures are compared to the Stage 0 ceiling by the `BUDGET-CEILING` rule.

---

## Quality Checklist

- [ ] Every cost and benefit numeric with basis of estimate
- [ ] ROI, payback, NPV with discount rate and −30% sensitivity
- [ ] Every benefit traces to RC-NNN and KPI-NNN
- [ ] Total cost compared to Stage 0 ceiling; descoping option if exceeded
- [ ] Tracker has client-side owner, cadence, corrective trigger, handover date
- [ ] Executive Summary readable by the sponsor alone

---

**Pipeline complete.** Human runs `babok approve <id> 6`; then `babok export <id>` or `babok make docx <id>` for the final engagement pack.
