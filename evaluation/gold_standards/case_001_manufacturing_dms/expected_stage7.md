# STAGE 7: RISK ASSESSMENT & MITIGATION STRATEGY

**Project:** Document Management System Implementation
**Industry:** Manufacturing
**Date:** 2025-04-02
**Status:** ✅ APPROVED

---

## 🎯 EXECUTIVE SUMMARY

17 risks are identified across 4 categories: Technical (6), Organisational (5), Regulatory (4), and Financial (2). Three risks are rated Critical (RED): SAP integration failure, e-invoice mandate non-compliance, and GDPR breach. The DPIA confirms processing is large-scale and requires formal DPO sign-off before go-live.

**Risk Heat Map:**

| Likelihood \ Impact | Negligible | Minor | Moderate | Major | Catastrophic |
|---|---|---|---|---|---|
| Almost Certain | | | R-007 | | |
| Likely | | R-005 R-009 | R-003 R-006 | R-002 | |
| Possible | | R-011 R-014 | R-001 R-008 R-013 | R-004 R-010 | R-015 |
| Unlikely | | R-012 R-016 | R-017 | R-006 | R-001 |
| Rare | | | | | R-015 |

---

## 1. RISK REGISTER

| ID | Risk | Category | Likelihood | Impact | Rating | Owner | Mitigation | Contingency |
|---|---|---|---|---|---|---|---|---|
| R-001 | SAP 6.0 API limitations block DMS integration | Technical | Possible | Major | HIGH | IT Manager | Confirm API specs before contract; include integration test in RFP mandatory criteria | Manual import bridge as fallback; escalate to SAP support |
| R-002 | E-invoice mandate deadline missed | Regulatory | Likely | Major | CRITICAL | CFO | Mandate compliance in Phase 2 (Month 6); dedicated test with national portal | Temporary manual XML workaround; legal counsel to assess fine exposure |
| R-003 | OCR accuracy below 90% for complex invoices | Technical | Likely | Moderate | HIGH | IT Manager | Include OCR accuracy SLA in vendor contract; test with 200 real invoices in POC | Exception queue with manual verification; renegotiate SLA |
| R-004 | GDPR data breach during migration | Regulatory | Possible | Major | HIGH | DPO | Encrypt data in transit; limit migration access to 2 named individuals; penetration test post-migration | Breach notification procedure; DPO leads incident response; supervisory authority notification within 72h |
| R-005 | Staff resistance to digital workflows | Organisational | Likely | Minor | MEDIUM | CFO | Change management plan; champions programme; involve AP team in UAT | Extended parallel run (paper + digital) for 30 days post go-live |
| R-006 | DMS vendor financial instability / acquisition | Technical | Unlikely | Major | MEDIUM | IT Manager | Source code escrow agreement; data export capability verified in contract | Exit plan: export all data in standard format; re-tender |
| R-007 | Scope creep — additional departments request inclusion | Organisational | Almost Certain | Moderate | HIGH | BA | Change freeze after Stage 4 approval; formal CR process; Steering Committee authority over scope | Phase 2 features list captures out-of-scope requests for future phases |
| R-008 | Migration scanning quality below 95% accuracy | Technical | Possible | Moderate | MEDIUM | IT Manager | Pilot scan 500 documents before contracting scanning service; define QA sampling criteria | Reject and re-scan batches below threshold; QA random sample 5% |
| R-009 | Key IT resource unavailable during implementation | Organisational | Likely | Minor | MEDIUM | CEO | IT Manager 100% allocation Phase 1; identify backup resource | Vendor-delivered implementation (higher cost) |
| R-010 | Budget overrun | Financial | Possible | Major | HIGH | CFO | 15% contingency reserve in budget; monthly budget review; change control for scope additions | Request additional €30,000 from board; defer Phase 4 optimisations |
| R-011 | SAP integration data quality errors | Technical | Possible | Minor | LOW | IT Manager | UAT with 100 real invoices; three-way match testing with procurement | Exception queue with manual correction; IT alert for >2% error rate |
| R-012 | Physical archive inventory inaccurate | Technical | Unlikely | Minor | LOW | Chief Accountant | Pre-migration physical audit; count documents per category | Extended scanning timeline; prioritise legally required docs |
| R-013 | National e-invoice portal API changes post go-live | Regulatory | Possible | Moderate | MEDIUM | IT Manager | Monitor government change notices; include vendor support obligation in SLA | Vendor hotfix SLA: 5 business days for mandatory compliance changes |
| R-014 | User training insufficient for complex workflows | Organisational | Likely | Minor | MEDIUM | BA | Role-specific training design; train-the-trainer approach; job aids and quick reference guides | Extended hypercare; additional training sessions on request |
| R-015 | Cloud DMS suffers major outage (>4 hours) | Technical | Rare | Catastrophic | HIGH | IT Manager | 99.9% uptime SLA in contract; disaster recovery plan; business continuity procedure | Manual paper fallback for <4h; vendor SLA penalty applies; escalate to vendor CTO |
| R-016 | GDPR supervisory authority investigation | Regulatory | Unlikely | Minor | LOW | DPO | DPIA completed; DPA signed; privacy by design embedded | DPO leads response; legal counsel engaged |
| R-017 | Supplier non-adoption of e-invoice format | Organisational | Possible | Moderate | MEDIUM | Procurement Mgr | Supplier communication programme; grace period for PDF still accepted | Retain PDF fallback with manual exception process for non-compliant suppliers |

---

## 2. DATA PROTECTION IMPACT ASSESSMENT (DPIA)

### 2.1 DPIA Trigger Assessment (GDPR Article 35)

| Trigger Criterion | Applicable? | Evidence |
|---|---|---|
| New technology | YES | Cloud DMS is new processing technology |
| Large-scale personal data processing | YES | ~44,750 documents; data of employees, suppliers, customers |
| Systematic monitoring | NO | No monitoring of individuals |
| Special categories of data | NO | No health, biometric, or other special category data |

**Conclusion: DPIA is MANDATORY before go-live.**

### 2.2 Processing Activities Inventory

| Activity | Personal Data | Lawful Basis | Retention | Risk |
|---|---|---|---|---|
| Invoice processing | Supplier employee names, bank accounts, VAT numbers | Legal obligation (accounting law) | 7 years | Medium |
| Contract storage | Signatory names, contact details | Contract performance | Duration + 10 years | Medium |
| Delivery notes | Driver names, signatures | Legitimate interest | 5 years | Low |
| Approval audit trail | Employee names, user IDs, actions | Legal obligation (audit) | 7 years | Low |
| Email invoice capture | Sender names, email addresses | Legal obligation | 7 years | Medium |

### 2.3 Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| Unauthorised access to financial documents | HIGH | Low (RBAC + MFA) | RBAC, MFA, audit log |
| Data breach during migration | HIGH | Low (encrypted transfer) | Encryption, limited access |
| Vendor accessing client data | MEDIUM | Low (contractual DPA) | DPA with vendor, audit rights |
| Cross-border data transfer | HIGH | Low (EU data residency) | Contractual EU data residency clause |
| Data subject unable to exercise rights | MEDIUM | Low (FR-018 implemented) | Data subject rights UI |

### 2.4 DPIA Conclusions

- **Residual Risk:** LOW — all high risks mitigated to acceptable level with proposed controls
- **DPO Recommendation:** Approve subject to: (1) vendor DPA signed, (2) EU data residency confirmed, (3) RBAC configuration reviewed by DPO before go-live
- **Supervisory Authority Consultation:** Not required (residual risk is low)
- **Review Date:** 12 months post go-live, or upon material system change

---

## 3. RISK MONITORING PLAN

| Review | Frequency | Owner | Forum |
|---|---|---|---|
| Risk register review | Monthly | BA | Steering Committee |
| Technical risk review | Weekly (Phase 1–2) | IT Manager | IT team standup |
| Budget risk review | Monthly | CFO | CFO + BA |
| DPIA compliance review | Quarterly | DPO | DPO + IT |
| Post go-live risk review | 30, 90 days | BA | Steering Committee |

---

*Prepared by: BABOK Analyst Agent v1.8.1 | Framework: BABOK® v3*
