# STAGE 8: BUSINESS CASE & ROI MODEL

**BABOK Knowledge Area:** Solution Evaluation, Strategy Analysis
**Model Tier:** DEEP ANALYSIS MODE (Gemini Pro 3 / Claude Opus 4.6)
**Estimated Duration:** 1-2 hours active work + 2-3 days for financial validation

**CLI Command:** `babok approve <id> 8` — marks Stage 8 as approved (project analysis complete)
**CLI Reject:** `babok reject <id> 8 -r "reason"` — rejects Stage 8 with reason

---

## Why Deep Analysis Mode

- Financial modeling requires high precision — errors directly impact investment decisions
- NPV/IRR calculations with multi-year projections need careful validation
- Sensitivity analysis (what-if scenarios) requires systematic parameter variation
- Executive recommendation must be well-supported

```
[DEEP ANALYSIS MODE ACTIVATED]
Model: Gemini Pro 3 / Claude Opus 4.6
Reasoning: Financial modeling requires high precision; errors here impact investment decision
Context: [Cost data from vendors, baseline metrics from Stage 2, savings estimates from Stage 6]
```

---

## Objectives

1. Calculate total cost of ownership (TCO) for the solution
2. Quantify expected benefits (savings, revenue, risk reduction)
3. Build financial model with NPV, IRR, and payback period
4. Perform sensitivity analysis (best/worst/expected scenarios)
5. Compare investment options (if multiple approaches considered)
6. Formulate executive recommendation

## Prerequisites

- Stages 1-7 approved (all project data available)
- Stage 2: Baseline cost data
- Stage 5: Architecture decisions (cost implications)
- Stage 6: Implementation roadmap (timeline and resource costs)
- Stage 7: Risk assessment (contingency costs)
- Vendor quotes (if available)

## Process

### Step 8.1: Total Cost of Ownership (TCO)

**Assumptions:**
- TCO calculated over 3-5 year horizon (standard for mid-market IT projects)
- Costs include: implementation, licensing, operations, training, change management
- All costs in single currency, adjusted for inflation if multi-year

**Evidence:**
- Stage 6: Resource plan (FTE-months × cost rates)
- Stage 5: Architecture decisions (vendor pricing, infrastructure costs)
- Stage 1: Budget constraints (upper limit)

**Agent Action:** Build TCO model:

#### One-Time Implementation Costs:

| Cost Category | Estimate (Low) | Estimate (Expected) | Estimate (High) | Source |
|--------------|----------------|---------------------|-----------------|--------|
| Software licenses / setup | [AMOUNT] | [AMOUNT] | [AMOUNT] | [Vendor quote / estimate] |
| Infrastructure (if on-prem) | [AMOUNT] | [AMOUNT] | [AMOUNT] | [IT estimate] |
| Implementation services | [AMOUNT] | [AMOUNT] | [AMOUNT] | [Vendor/consultant quote] |
| Data migration | [AMOUNT] | [AMOUNT] | [AMOUNT] | [Stage 6 effort estimate] |
| Integration development | [AMOUNT] | [AMOUNT] | [AMOUNT] | [Stage 5 complexity] |
| Training | [AMOUNT] | [AMOUNT] | [AMOUNT] | [Stage 6 training plan] |
| Change management | [AMOUNT] | [AMOUNT] | [AMOUNT] | [Stage 6 plan] |
| Contingency ([X]%) | [AMOUNT] | [AMOUNT] | [AMOUNT] | [Stage 7 recommendation] |
| **TOTAL ONE-TIME** | **[AMOUNT]** | **[AMOUNT]** | **[AMOUNT]** | |

#### Annual Recurring Costs:

| Cost Category | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 | Source |
|--------------|--------|--------|--------|--------|--------|--------|
| Software licenses (annual) | [AMT] | [AMT] | [AMT] | [AMT] | [AMT] | [Vendor] |
| Infrastructure/hosting | [AMT] | [AMT] | [AMT] | [AMT] | [AMT] | [IT] |
| Support & maintenance | [AMT] | [AMT] | [AMT] | [AMT] | [AMT] | [Vendor] |
| Internal IT support (FTE) | [AMT] | [AMT] | [AMT] | [AMT] | [AMT] | [Stage 6] |
| Ongoing training | [AMT] | [AMT] | [AMT] | [AMT] | [AMT] | [Estimate] |
| **TOTAL ANNUAL** | **[AMT]** | **[AMT]** | **[AMT]** | **[AMT]** | **[AMT]** | |

**QUESTIONS FOR HUMAN:**

1. **Vendor Quotes:**
   Do you have vendor quotes or pricing for the proposed solution?
   - Vendor A: [NAME] — [Quote amount or "not yet"]
   - Vendor B: [NAME] — [Quote amount or "not yet"]
   If no quotes available, should we use market estimates?

2. **Internal Cost Rates:**
   What are your internal cost rates for estimating FTE costs?
   - Average fully-loaded cost per FTE per month: [AMOUNT CURRENCY]
   - Or: average hourly rate: [AMOUNT CURRENCY]

3. **TCO Horizon:**
   What time horizon for the financial analysis?
   [ ] 3 years
   [ ] 5 years
   [ ] Other: [SPECIFY]

4. **Discount Rate:**
   What discount rate should we use for NPV calculation?
   - Company WACC: [X%]
   - Or use industry standard: [8-12% typical for mid-market]

**WAIT FOR HUMAN INPUT.**

---

### Step 8.2: Benefits Quantification

**Assumptions:**
- Benefits sourced from Stage 2 baseline (cost of current state) and Stage 6 (improvements)
- Conservative estimates used for financial projections
- Benefits ramp up over time (not 100% from day one)

**Evidence:**
- Stage 2: Baseline metrics (costs, time, errors)
- Stage 6: Expected improvements per phase

**Agent Action:** Quantify benefits:

#### Direct Financial Benefits (Cost Savings):

| Benefit Category | Annual Savings | Ramp-Up | Year 1 | Year 2 | Year 3 | Source |
|-----------------|---------------|---------|--------|--------|--------|--------|
| Labor savings (FTE hours) | [AMT] | [X%] | [AMT] | [AMT] | [AMT] | Stage 2 baseline |
| Process efficiency | [AMT] | [X%] | [AMT] | [AMT] | [AMT] | Stage 2 bottlenecks |
| Error reduction | [AMT] | [X%] | [AMT] | [AMT] | [AMT] | Stage 2 error costs |
| Physical costs eliminated | [AMT] | [X%] | [AMT] | [AMT] | [AMT] | Stage 2 physical costs |
| System consolidation | [AMT] | [X%] | [AMT] | [AMT] | [AMT] | Stage 5 architecture |
| **TOTAL DIRECT** | **[AMT]** | | **[AMT]** | **[AMT]** | **[AMT]** | |

**Ramp-Up Assumption:** Benefits typically reach:
- Year 1: 30-50% of full benefit (implementation + adoption period)
- Year 2: 70-90% of full benefit (stabilization)
- Year 3+: 100% of full benefit (full adoption)

#### Indirect Benefits (Risk Avoidance / Strategic Value):

| Benefit | Estimated Value | Probability | Risk-Adjusted Value | Source |
|---------|----------------|------------|--------------------|---------|
| Compliance penalty avoidance | [AMT] | [X%] | [AMT] | Stage 1 regulatory risks |
| Audit cost reduction | [AMT] | [X%] | [AMT] | Stage 2 audit effort |
| Scalability (growth support) | [AMT] | [X%] | [AMT] | Stage 1 business growth |
| Customer satisfaction | [Qualitative] | - | [Hard to quantify] | Stage 1 drivers |

**QUESTIONS FOR HUMAN:**

1. **Benefit Validation:**
   Review the direct benefits. Are the savings estimates realistic?
   For each category, confirm or adjust:
   - Labor savings: [AGREE / Adjust to: ...]
   - Error reduction: [AGREE / Adjust to: ...]
   - Physical costs: [AGREE / Adjust to: ...]

2. **Benefit Ramp-Up:**
   How quickly do you expect benefits to materialize?
   - Year 1: [X%] of full benefit
   - Year 2: [X%]
   - Year 3: [X%]

3. **Revenue Impact:**
   Does this project have any REVENUE impact (not just cost savings)?
   [ ] No direct revenue impact
   [ ] Yes: [Describe — e.g., faster customer response, new capabilities]
   Estimated annual revenue impact: [AMOUNT or "hard to quantify"]

**WAIT FOR HUMAN INPUT.**

---

### Step 8.3: Financial Model (NPV, IRR, Payback)

**Agent Action:** Calculate key financial metrics:

#### Cash Flow Summary:

| Year | Costs | Benefits | Net Cash Flow | Cumulative |
|------|-------|----------|---------------|------------|
| Year 0 | -[Implementation] | 0 | -[AMOUNT] | -[AMOUNT] |
| Year 1 | -[Annual costs] | +[Year 1 benefits] | [+/- AMOUNT] | [AMOUNT] |
| Year 2 | -[Annual costs] | +[Year 2 benefits] | [+/- AMOUNT] | [AMOUNT] |
| Year 3 | -[Annual costs] | +[Year 3 benefits] | [+/- AMOUNT] | [AMOUNT] |
| Year 4 | -[Annual costs] | +[Year 4 benefits] | [+/- AMOUNT] | [AMOUNT] |
| Year 5 | -[Annual costs] | +[Year 5 benefits] | [+/- AMOUNT] | [AMOUNT] |

#### Key Financial Metrics:

| Metric | Value | Benchmark | Assessment |
|--------|-------|-----------|------------|
| **Total Investment (TCO)** | [AMOUNT] | - | - |
| **Total Benefits (5-year)** | [AMOUNT] | - | - |
| **Net Present Value (NPV)** | [AMOUNT] | > 0 | [PASS/FAIL] |
| **Internal Rate of Return (IRR)** | [X]% | > WACC ([Y]%) | [PASS/FAIL] |
| **Payback Period** | [X] months | < [Y] months (target) | [PASS/FAIL] |
| **ROI (3-year)** | [X]% | > [Y]% (target) | [PASS/FAIL] |
| **Benefit-Cost Ratio** | [X]:1 | > 1.5:1 | [PASS/FAIL] |

**NPV Calculation:**
```
NPV = Σ (Net Cash Flow_t / (1 + discount_rate)^t) for t = 0 to N
Discount rate: [X%]
```

**IRR:** The discount rate at which NPV = 0.

**Payback Period:** The month when cumulative net cash flow turns positive.

---

### Step 8.4: Sensitivity Analysis

**Agent Action:** Test how results change when assumptions vary:

#### Scenario Analysis:

| Scenario | Key Assumption Changes | NPV | IRR | Payback |
|----------|----------------------|-----|-----|---------|
| **Best Case** | Benefits +20%, Costs -10% | [AMT] | [X%] | [X months] |
| **Expected Case** | Base assumptions | [AMT] | [X%] | [X months] |
| **Worst Case** | Benefits -30%, Costs +20%, Delay +3 months | [AMT] | [X%] | [X months] |
| **Delay Scenario** | Implementation delayed 6 months | [AMT] | [X%] | [X months] |

#### Break-Even Analysis:

| Parameter | Break-Even Value | Expected Value | Safety Margin |
|-----------|-----------------|----------------|---------------|
| Minimum benefits to break even | [AMT/year] | [AMT/year] | [X%] |
| Maximum implementation cost | [AMT] | [AMT] | [X%] |
| Maximum annual cost | [AMT/year] | [AMT/year] | [X%] |

**Key Insight:** The project remains viable (NPV > 0) even if benefits are [X%] lower than expected OR costs are [X%] higher — providing a [Y%] safety margin.

---

### Step 8.5: Investment Option Comparison (if applicable)

If multiple solution approaches were considered in Stage 5:

| Criteria | Option A | Option B | Option C |
|----------|----------|----------|----------|
| Total Investment | [AMOUNT] | [AMOUNT] | [AMOUNT] |
| Annual Cost | [AMOUNT] | [AMOUNT] | [AMOUNT] |
| NPV (5-year) | [AMOUNT] | [AMOUNT] | [AMOUNT] |
| IRR | [X%] | [X%] | [X%] |
| Payback | [X months] | [X months] | [X months] |
| Risk Level | [H/M/L] | [H/M/L] | [H/M/L] |
| Fit with Requirements | [%] | [%] | [%] |
| **Recommendation** | | **RECOMMENDED** | |

---

### Step 8.6: Executive Recommendation

**Agent Action:** Formulate clear investment recommendation:

```
RECOMMENDATION: [PROCEED / PROCEED WITH CONDITIONS / DEFER / DO NOT PROCEED]

RATIONALE:
1. [Financial justification: NPV, IRR, payback meet targets]
2. [Strategic justification: Addresses [X] root causes, enables [Y] capabilities]
3. [Risk justification: Top risks mitigated, DPIA completed, contingency planned]

CONDITIONS (if applicable):
1. [Condition 1 — e.g., vendor contract terms]
2. [Condition 2 — e.g., resource commitment from IT]

IMMEDIATE NEXT STEPS:
1. [Step 1 — e.g., Approve budget, sign vendor contract]
2. [Step 2 — e.g., Assign project team]
3. [Step 3 — e.g., Kick off Phase 0]

DECISION NEEDED BY: [DATE — aligned with regulatory deadline or market window]
```

**QUESTIONS FOR HUMAN:**

1. **Financial Model Review:**
   Do the NPV/IRR/payback calculations look correct?
   Any cost or benefit assumptions you want to adjust?

2. **Recommendation:**
   Based on the business case, do you agree with the recommendation?
   [ ] AGREE — proceed as recommended
   [ ] MODIFY — proceed with changes: [SPECIFY]
   [ ] DEFER — revisit later: [SPECIFY timing]

3. **Presentation:**
   Who will the business case be presented to?
   - Audience: [Steering Committee / Board / CFO / Other]
   - Format: [Presentation / Document / Both]
   - Date: [Planned presentation date]

**WAIT FOR HUMAN INPUT.**

---

## Deliverable Template: STAGE_08_Business_Case_ROI.md

```markdown
# STAGE 8: BUSINESS CASE & ROI MODEL

**Project:** [Project Name]
**Project ID:** [BABOK-YYYYMMDD-XXXX]
**Date:** [AUTO-GENERATED]
**Status:** APPROVED BY HUMAN on [DATE]

---

## EXECUTIVE SUMMARY (1-2 PAGES)

**Investment Request:** [TOTAL AMOUNT CURRENCY]
**Recommendation:** [PROCEED / PROCEED WITH CONDITIONS / DEFER / DO NOT PROCEED]

**Financial Highlights:**
| Metric | Value |
|--------|-------|
| Total Investment | [AMOUNT] |
| Annual Benefits (at full ramp) | [AMOUNT] |
| Payback Period | [X months] |
| 3-Year NPV | [AMOUNT] |
| IRR | [X%] |
| ROI (3-year) | [X%] |

**Key Benefits:**
1. [Benefit 1]: [AMOUNT CURRENCY/year] savings
2. [Benefit 2]: [AMOUNT CURRENCY/year] savings
3. [Benefit 3]: [Qualitative benefit]

**Key Risks:**
1. [Risk 1] — Mitigated by: [Strategy]
2. [Risk 2] — Mitigated by: [Strategy]

**Decision Timeline:** Approval needed by [DATE] to meet [regulatory deadline / business window]

---

## DETAILED FINANCIAL MODEL

### 1. TOTAL COST OF OWNERSHIP
[One-time + recurring cost tables]

### 2. BENEFITS QUANTIFICATION
[Direct + indirect benefits with ramp-up]

### 3. FINANCIAL METRICS
[NPV, IRR, Payback, ROI calculations]

### 4. SENSITIVITY ANALYSIS
[Best/Expected/Worst scenarios + break-even]

### 5. OPTION COMPARISON (if applicable)
[Multi-option comparison table]

### 6. RECOMMENDATION
[Full executive recommendation with rationale and next steps]

---

## HUMAN APPROVAL

**Next Command:** `Approve 8` — marks project analysis as complete
**Then:** `Export all` — generates complete documentation package
```

---

## Quality Checklist for Stage 8

Before presenting for approval:

- [ ] TCO includes ALL cost categories (one-time + recurring)
- [ ] Benefits sourced from Stage 2 baseline data (not invented)
- [ ] Conservative estimates used (not optimistic projections)
- [ ] Benefit ramp-up applied (not 100% from Year 1)
- [ ] NPV calculated with appropriate discount rate
- [ ] IRR calculated and compared to WACC/hurdle rate
- [ ] Payback period calculated
- [ ] Sensitivity analysis covers best/expected/worst scenarios
- [ ] Break-even analysis shows safety margin
- [ ] Executive recommendation is clear and actionable
- [ ] All financial data verifiable — no hallucinated numbers
- [ ] Calculations can be reproduced in a spreadsheet

---

**Version:** 1.4
**Stage Owner:** Business Analyst
**BABOK Techniques Used:** Cost-Benefit Analysis, Financial Analysis, Decision Analysis, Estimation
