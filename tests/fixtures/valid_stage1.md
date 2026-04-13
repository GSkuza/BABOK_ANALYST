# STAGE 1: PROJECT INITIALIZATION & STAKEHOLDER MAPPING

**Project Name:** Document Management Modernisation
**Industry:** Manufacturing
**Company Size:** €25M annually, 120 employees
**Date:** 2025-06-15
**Status:** APPROVED

---

## Executive Summary

**Purpose:** Define project scope, identify stakeholders, and establish success criteria.

**Key Findings:**
1. 5 stakeholder groups identified; CFO Anna Kowalska is project sponsor
2. Critical regulatory deadline: E-invoicing mandate compliance required by 2026-01-01
3. Baseline inefficiency cost: €45,000/year in manual invoice processing

**Business Impact Summary:**
- **Cost Impact:** €45,000/year savings potential
- **Risk Mitigation:** GDPR compliance and e-invoicing mandate coverage
- **ROI:** Payback period 14 months, NPV €78,000, IRR 42%

---

## Project Scope — In Scope

Documents included in scope:
- Incoming supplier invoices (approx. 500/month)
- Outgoing customer invoices (approx. 200/month)
- Purchase orders
- Delivery notes
- Contracts (supplier and customer)

---

## Project Scope — Out of Scope

- HR documents (separate HR system project planned for Q3 2026)
- Technical drawings (CAD system handles these)
- Board meeting minutes

---

## System Landscape

| System | Vendor | Version | Integration Required |
|--------|--------|---------|---------------------|
| ERP | SAP Business One | 10.0 | YES |
| Accounting | Comarch ERP | 2024 | YES |
| DMS | None currently | N/A | Greenfield |
| E-signature | None currently | N/A | YES |

---

## Stakeholder Register

| ID | Name | Role | Department | Interest | Influence |
|----|------|------|------------|----------|-----------|
| SH-001 | Anna Kowalska | CFO / Project Sponsor | Finance | HIGH | HIGH |
| SH-002 | Marek Nowak | IT Manager | IT | HIGH | HIGH |
| SH-003 | Beata Wiśniewska | Finance Manager | Finance | HIGH | MEDIUM |
| SH-004 | Jan Dąbrowski | Compliance Officer | Legal | MEDIUM | HIGH |
| SH-005 | Tomasz Lewandowski | COO | Operations | MEDIUM | MEDIUM |

---

## RACI Matrix

| Activity | Anna Kowalska | Marek Nowak | Beata Wiśniewska | Jan Dąbrowski |
|----------|--------------|-------------|-----------------|---------------|
| Define Scope | C | C | R | C |
| Approve Budget | A | I | C | I |
| Vendor Selection | A | R | C | C |
| Go-Live Approval | A | C | R | C |
| GDPR Sign-off | C | C | C | A |

---

## Success Criteria — Quantitative KPIs

| KPI | Baseline | Target | Improvement |
|-----|----------|--------|-------------|
| Invoice processing time | 45 minutes/invoice | 8 minutes/invoice | 82% reduction |
| Document approval cycle | 5 days | 1 day | 80% reduction |
| Archive retrieval time | 25 minutes | 3 minutes | 88% reduction |
| Error rate in processing | 8% | <2% | 75% reduction |
| Annual paper/print cost | €12,000/year | €1,000/year | 92% reduction |
| FTE hours saved | — | 180 hours/month | — |

---

## Success Criteria — ROI Targets

- **Payback Period:** 14 months
- **3-Year NPV:** €78,000 (at 8% discount rate)
- **IRR:** 42%
- **3-Year Total Savings:** €135,000

---

## Regulatory Requirements

| Regulation | Applicability | Key Requirements | Deadline | Risk if Non-Compliant |
|------------|---------------|------------------|----------|----------------------|
| GDPR | YES | Data protection, DPIA, RBAC, right to erasure | Ongoing | Fines up to 4% revenue |
| E-invoicing Mandate | YES (PL) | KSeF structured XML format, government portal submission | 2026-01-01 | Business disruption |
| Financial Reporting | YES | 5-year document retention, audit trail | Ongoing | Audit failures |
| ISO 9001 | YES | Document control procedures | Ongoing | Loss of certification |

---

## Communication Plan

| Stakeholder Group | Frequency | Method | Content |
|-------------------|-----------|--------|---------|
| Steering Committee | Bi-weekly | Meeting 1h | Progress, risks, decisions |
| Finance Team | Weekly | Email + Meeting 30min | Requirements, UAT |
| IT Team | Daily | Slack standup 15min | Technical specs |
| All Staff | Monthly | Email newsletter | Updates, training schedule |

---

## Project Constraints

**Budget:**
- Estimated Range: €30,000 – €60,000
- Hard deadline: E-invoicing compliance by 2026-01-01
- Target go-live: 2025-12-01

**Timeline:**
- Project Start: 2025-07-01
- Go-Live Target: 2025-12-01
- Hard Regulatory Deadline: 2026-01-01

---

## Assumptions & Dependencies

**Assumptions:**
1. SAP Business One API access will be granted within 2 weeks of project start
2. Budget of €30,000–€60,000 has board approval
3. Users have modern browsers (Chrome/Firefox, last 2 versions)
4. IT staff (Marek Nowak) available 50% FTE during implementation

**Dependencies:**
1. SAP API credentials from vendor — IT Manager to request by 2025-07-15
2. Legal approval on e-signature provider — Jan Dąbrowski to provide by 2025-07-30
3. Sample invoice dataset — Beata Wiśniewska to collect by 2025-07-20

---

## Open Questions

| Q# | Question | Owner | Target Date | Status |
|----|----------|-------|-------------|--------|
| Q-001 | Pilot single department or full rollout? | Anna Kowalska | 2025-07-10 | OPEN |
| Q-002 | Cloud SaaS vs On-premise? | Marek Nowak | 2025-07-10 | OPEN |
| Q-003 | Historical document digitisation — how far back? | Beata Wiśniewska | 2025-07-20 | OPEN |
