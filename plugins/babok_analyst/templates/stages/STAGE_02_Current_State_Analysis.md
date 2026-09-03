# STAGE 2: CURRENT STATE ANALYSIS (AS-IS)

**Project:** [Project Name]
**Project ID:** [BABOK-YYYYMMDD-XXXX]
**Date:** [YYYY-MM-DD]
**Status:** PENDING APPROVAL

---

## Executive Summary

**Purpose:** Document AS-IS processes, systems, and baseline metrics for ROI and gap analysis.

**Key findings:**
1. [X] core processes mapped; primary bottleneck: [Description]
2. Annual operational cost baseline: [AMOUNT CURRENCY]
3. [Y] pain points documented from Stage 1 scope

---

## AS-IS Process Map or BPMN description

### Process 1: [Process Name]

**Trigger:** [What starts the process]
**End state:** [What ends the process]
**Average duration:** [X] [unit] per transaction
**Monthly volume:** [NUMBER] transactions

| Step | Actor | Action | System | Duration | Manual/Auto |
|------|-------|--------|--------|----------|-------------|
| 1 | [Role] | [Action] | [System] | [X min] | Manual |
| 2 | [Role] | [Action] | [System] | [X min] | Auto |

<!-- guidance: Use BPMN 2.0 notation for diagrams; reference diagram file if attached -->

---

## Pain Points Analysis

| ID | Pain Point | Process | Frequency | Time Impact | Cost Impact (CURRENCY/year) | Affected Roles |
|----|-----------|---------|-----------|-------------|----------------------------|----------------|
| PP-001 | [Description] | [Process] | Daily | 40 hrs/month | 120000 | Finance team |
| PP-002 | [Description] | [Process] | Weekly | 8 hrs/month | 24000 | Procurement |

**Workarounds:**

| Workaround | Purpose | Risk |
|------------|---------|------|
| Excel tracking | Fill ERP gap | Data inconsistency |

---

## Baseline Metrics

### Volume metrics

| Metric | Value | Period | Unit | Source | Confidence |
|--------|-------|--------|------|--------|------------|
| Purchase orders | 1200 | Monthly | PO | ERP report | High |
| Invoices processed | 3500 | Monthly | invoices | ERP report | High |

### Time metrics

| Metric | Value | Period | Source |
|--------|-------|--------|--------|
| Month-end close | 5 | business days | Finance log |
| PO approval cycle | 3.2 | days average | Workflow audit |

### Cost metrics

| Category | Annual Amount (CURRENCY) | % of Total |
|----------|--------------------------|------------|
| Labor (FTE on process) | 450000 | 65% |
| System licenses | 120000 | 17% |
| Error/rework | 80000 | 12% |
| **Total** | **690000** | **100%** |

---

## System Inventory

| System | Version | Owner | Users | Integration Points | Limitations |
|--------|---------|-------|-------|-------------------|-------------|
| [ERP] | [6.0] | IT | 45 | [CRM, BI] | No real-time inventory |
| [WMS] | [Custom] | Operations | 12 | [ERP file export] | Manual sync |

---

## Bottleneck Identification

| ID | Bottleneck | Process | Measurable Impact | Root Symptom |
|----|------------|---------|-------------------|--------------|
| BN-001 | Manual PO re-entry | Procurement | 18 hrs/week wasted | PP-001 |
| BN-002 | Batch inventory sync | Warehouse | 15% stock variance | PP-002 |

---

## Quality Checklist

- [ ] All Stage 1 pain points addressed in Pain Points Analysis (S2-C1)
- [ ] Baseline metrics are numeric with units and periods (S2-Q1, S2-Q3)
- [ ] Each bottleneck cites measurable impact (S2-Q2)
- [ ] System inventory aligns with Stage 1 System Landscape (S2-C2)

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
| 1.0 | [YYYY-MM-DD] | [Author] | Initial deliverable |
