# STAGE 6: GAP ANALYSIS & IMPLEMENTATION ROADMAP

**Project:** [Project Name]
**Project ID:** [BABOK-YYYYMMDD-XXXX]
**Date:** [YYYY-MM-DD]
**Status:** PENDING APPROVAL

---

## Executive Summary

**Purpose:** Define path from AS-IS to TO-BE with phases, resources, and milestones.

**Summary:** [X] gaps | [Y] phases | [Z] months total | Go-live: [YYYY-MM-DD]

---

## Gap Analysis Table (AS-IS vs TO-BE)

| Gap ID | Area | AS-IS State | TO-BE State | Gap Description | Effort | FR Link | Dependencies |
|--------|------|-------------|-------------|-----------------|--------|---------|--------------|
| GAP-001 | Process | Manual PO entry | Automated workflow | Implement approval workflow | M | FR-001 | None |
| GAP-002 | Technology | SAP ERP 6.0 | S/4HANA cloud | Platform migration | XL | FR-010 | GAP-001 |
| GAP-003 | Data | Batch inventory | Real-time sync | API integration | L | FR-002 | GAP-002 |

---

## Implementation Phases

### Phase 1: Foundation ([YYYY-MM-DD] – [YYYY-MM-DD])

- **Scope:** [GAP-001, quick wins]
- **Effort:** [X] person-months
- **Exit criteria:** [Measurable completion criterion]

### Phase 2: Core rollout ([YYYY-MM-DD] – [YYYY-MM-DD])

- **Scope:** [GAP-002]
- **Effort:** [Y] person-months
- **Exit criteria:** [Measurable completion criterion]

---

## Resource Plan

| Phase | Internal FTE | External FTE | Skills Required | Cost Estimate (CURRENCY) |
|-------|--------------|--------------|-----------------|--------------------------|
| Phase 1 | 2.0 | 1.5 | BA, SAP FI | 180000 |
| Phase 2 | 3.0 | 4.0 | SAP MM/SD, Integration | 520000 |
| **Total** | **5.0** | **5.5** | — | **700000** |

---

## Key Milestones

| Milestone | Date | Completion Criterion | Owner |
|-----------|------|----------------------|-------|
| Blueprint sign-off | 2026-06-30 | All FR-001–FR-020 approved | Project Sponsor |
| UAT complete | 2027-06-15 | 100% MUST test cases passed | UAT Lead |
| Go-live | 2027-09-01 | Production traffic on S/4HANA | IT Director |

---

## Critical Path

```
GAP-002 (platform) → GAP-003 (integration) → UAT → Go-live
Duration: [X] weeks (longest dependency chain)
```

| Activity | Duration | Predecessor |
|----------|----------|-------------|
| Platform migration | 16 weeks | Blueprint |
| Integration build | 8 weeks | Platform migration |
| UAT | 4 weeks | Integration build |

---

## Quality Checklist

- [ ] Each milestone has calendar date and measurable criterion (S6-Q1)
- [ ] Each phase has effort in person-days/months (S6-Q2)
- [ ] Critical path identifies longest chain (S6-Q3)
- [ ] Every gap traces to Stage 4 requirement (S6-C1)
- [ ] Resource cost within Stage 1 budget (S6-C2)
- [ ] End date on or before Stage 1 target (S6-C3)

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
| 1.0 | [YYYY-MM-DD] | [Author] | Initial roadmap |
