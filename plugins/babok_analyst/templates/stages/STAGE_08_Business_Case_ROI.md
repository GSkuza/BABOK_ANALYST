# STAGE 8: BUSINESS CASE & ROI MODEL

**Project:** [Project Name]
**Project ID:** [BABOK-YYYYMMDD-XXXX]
**Date:** [YYYY-MM-DD]
**Status:** PENDING APPROVAL

---

## Executive Summary

**Investment request:** [TOTAL AMOUNT CURRENCY]
**Recommendation:** [PROCEED / PROCEED WITH CONDITIONS / DEFER / DO NOT PROCEED]

| Metric | Value |
|--------|-------|
| Total investment (3-year TCO) | [AMOUNT] |
| Annual benefits (full ramp) | [AMOUNT] |
| Payback period | [X] months |
| 3-year NPV | [AMOUNT] |
| IRR | [X]% |

---

## Cost-Benefit Analysis (CBA) — 3-year projection

| Year | Costs (CURRENCY) | Benefits (CURRENCY) | Net Cash Flow | Cumulative |
|------|------------------|---------------------|---------------|------------|
| 0 (implementation) | 850000 | 0 | -850000 | -850000 |
| 1 | 220000 | 310000 | 90000 | -760000 |
| 2 | 230000 | 420000 | 190000 | -570000 |
| 3 | 240000 | 450000 | 210000 | -360000 |

**Data sources:** [Vendor quote Q-2026-01], [Stage 2 baseline], [Stage 6 resource plan]

---

## NPV Calculation

| Parameter | Value |
|-----------|-------|
| Discount rate | 8% (WACC) |
| Horizon | 3 years |
| **NPV** | **[AMOUNT CURRENCY]** |

**Justification for discount rate:** [Source — e.g. company WACC policy, industry benchmark]

---

## IRR Calculation

| Metric | Value | Target |
|--------|-------|--------|
| IRR | 14.2% | > WACC 8% |
| **Decision** | **Proceed** | NPV > 0 |

---

## Payback Period

| Scenario | Payback (months) | Stage 1 Target |
|----------|------------------|----------------|
| Expected | 28 | ≤ 36 months |
| Pessimistic | 34 | ≤ 36 months |

---

## Sensitivity Analysis (pessimistic / optimistic scenarios)

| Assumption Varied | Pessimistic | Expected | Optimistic |
|-------------------|-------------|----------|------------|
| Implementation cost | +20% | Base | -10% |
| Benefit realization | -30% | Base | +10% |
| **NPV result** | [AMOUNT] | [AMOUNT] | [AMOUNT] |
| **IRR result** | [X]% | [X]% | [X]% |

**Break-even:** Benefits exceed costs in month [X] under expected scenario.

---

## Implementation Cost Breakdown

| Category | Amount (CURRENCY) | Source |
|----------|-------------------|--------|
| Software licenses (one-time) | 320000 | Vendor quote |
| Implementation services | 280000 | Stage 6 resource plan |
| Data migration | 95000 | Stage 6 GAP-002 |
| Training & change management | 65000 | Stage 6 plan |
| Contingency (10%) | 76000 | Stage 7 recommendation |
| **Total implementation** | **836000** | |

---

## Executive Recommendation

**Decision:** [GO / NO-GO / CONDITIONAL GO]

**Rationale:**
1. NPV positive at [AMOUNT]; IRR [X]% exceeds WACC
2. Payback [X] months within Stage 1 target
3. Key risks mitigated per Stage 7 (R-001, R-002)

**Conditions (if any):**
- [Condition 1]

**Next steps:**
1. Secure steering committee approval by [YYYY-MM-DD]
2. Initiate Phase 1 per Stage 6 roadmap

---

## Quality Checklist

- [ ] Financial parameters cite data sources (S8-Q1)
- [ ] Sensitivity varies ≥ 2 key assumptions (S8-Q2)
- [ ] NPV discount rate stated and justified (S8-Q3)
- [ ] Executive recommendation states go/no-go with rationale (S8-Q4)
- [ ] Costs align with Stage 6 resource plan (S8-C1)
- [ ] Savings trace to Stage 1 KPIs (S8-C2)
- [ ] Payback within Stage 1 maximum (S8-C3)
- [ ] Financial uncertainties reference Stage 7 risks (S8-C4)

---

## Approval Section

| Field | Value |
|-------|-------|
| Approver | [Name, Title] |
| Date | [YYYY-MM-DD] |
| Comments | [Optional] |

**Change log**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | [YYYY-MM-DD] | [Author] | Initial business case |
