# STAGE 3: PROBLEM DOMAIN ANALYSIS

**Project:** Document Management System Implementation  
**Industry:** Manufacturing  
**Date:** 2025-02-05  
**Status:** ✅ APPROVED  
**Analysis Mode:** Deep Analysis

---

## 🎯 EXECUTIVE SUMMARY

Stage 3 transforms the AS-IS inventory into a prioritised problem hierarchy. Root cause analysis using 5 Whys and Ishikawa methodology identifies **one systemic root cause** underlying all seven surface problems: **absence of a governed digital document lifecycle platform**. All other issues — manual data entry, physical routing, compliance gaps, shadow IT — are symptoms of this single gap.

**Priority Matrix:**

| Priority | Problem | Annual Cost | Regulatory Risk | Effort to Resolve |
|---|---|---|---|---|
| P1 (Critical) | No structured e-invoice output (EN 16931) | €0 now → mandate penalty TBD | CRITICAL | Medium |
| P2 (Critical) | No GDPR document retention automation | Fine risk €0–€1.4M | CRITICAL | Low–Medium |
| P3 (High) | Manual AP invoice processing (45 min/invoice) | €80,500/year | None | Medium |
| P4 (High) | Physical approval routing (5-day cycle) | Indirect: €36,000/year | None | Low |
| P5 (Medium) | No version control for technical drawings | Production risk | ISO 9001 | Medium |
| P6 (Medium) | Shadow IT SharePoint proliferation | Governance risk | GDPR | Low |
| P7 (Low) | Physical archive — no DR | €12,000/year | None | Low |

**Recommendation:** A single Cloud DMS solution with SAP integration resolves all 7 problems simultaneously.

---

## 1. ROOT CAUSE ANALYSIS

### 1.1 Five Whys Analysis — Invoice Processing

**Problem:** Invoice processing takes 45 minutes and 5 business days cycle time.

| Why? | Answer |
|---|---|
| Why does processing take 45 minutes? | Because AP clerks manually transcribe data from paper/PDF invoices into SAP |
| Why is data transcribed manually? | Because there is no OCR or structured invoice intake mechanism |
| Why is there no OCR/structured intake? | Because the company has no DMS with invoice ingestion capability |
| Why is there no DMS? | Because there has been no budget allocation and no compelling forcing function until now |
| Why has there been no forcing function? | Because the EU e-invoicing mandate (2026) is the first hard regulatory deadline requiring digital infrastructure |

**Root Cause RC-001:** Absence of DMS with OCR and structured document ingestion.

---

### 1.2 Five Whys Analysis — GDPR Compliance Gap

**Problem:** No automated GDPR retention/deletion policy for documents containing personal data.

| Why? | Answer |
|---|---|
| Why is there no retention policy enforcement? | Because documents are in physical files with no metadata or expiry tracking |
| Why are there no metadata or expiry tags? | Because documents are filed by type in physical binders — no digital catalogue |
| Why is there no digital catalogue? | Because there is no DMS |
| Why has GDPR not forced this earlier? | Because physical archives are harder to audit — risk has been below the radar |
| Why is risk rising? | Because GDPR enforcement has increased (€3B in EU fines 2023–2024); audits now include document retention |

**Root Cause RC-002:** No digital metadata layer enabling automated retention/deletion rule enforcement.

---

### 1.3 Five Whys Analysis — E-Invoicing Non-Compliance

**Problem:** Outgoing invoices are PDF only — not EN 16931 compliant.

| Why? | Answer |
|---|---|
| Why are invoices not in structured format? | Because SAP ERP 6.0 FI standard output is PDF print format, not XML |
| Why hasn't this been addressed? | Because the mandate was not enforced until recently |
| Why can't SAP generate EN 16931 without modification? | Because SAP 6.0 is end-of-mainstream maintenance; structured e-invoice requires a certified add-on or SAP S/4HANA |
| Why is SAP upgrade out of scope? | Because it is a separate €1M+ project; DMS is the faster path |
| What is the fastest compliant path? | E-invoicing middleware that receives SAP output and transforms to EN 16931 XML |

**Root Cause RC-003:** SAP ERP 6.0 cannot natively generate EN 16931 structured invoices without add-on or middleware.

---

### 1.4 Ishikawa Summary: All Seven Problems

```
                         [No Governed Digital Document Lifecycle Platform]
                                            |
        ┌───────────────┬─────────────────┼────────────────┬────────────────┐
     PEOPLE          PROCESS          TECHNOLOGY        REGULATION        DATA
  ──────────────  ──────────────  ──────────────  ──────────────────  ──────────
  Manual data      Physical        SAP 6.0 no      GDPR retention       Shadow IT
  entry clerks     routing         DMS module       unenforced          inconsistency
  
  No mobile        No approval     No OCR           E-invoice           No master
  approval         SLA             capability       mandate 2026        document index
  capability
                   No escalation   No version       ISO 9001 Clause 7.5 Data quality
                   workflow        control          gap                 degradation
```

---

## 2. PROBLEM PRIORITISATION

### 2.1 Impact / Effort Matrix

```
HIGH IMPACT
    │  P1 E-invoice ●         P3 AP Processing ●
    │  P2 GDPR ●
    │                         P5 Tech Drawings ●
    │           P4 Approval ●
    │  P6 Shadow IT ●
    │                         P7 Physical Archive ●
LOW IMPACT
    └──────────────────────────────────────────────
         LOW EFFORT                      HIGH EFFORT
```

**Quadrant Analysis:**
- **Quick Wins (High Impact, Low Effort):** P2 GDPR retention rules, P4 Digital approval workflow
- **Strategic Priorities (High Impact, Medium Effort):** P1 E-invoice, P3 AP OCR processing
- **Fill-ins (Medium Impact, Low Effort):** P5 Version control, P6 Shadow IT governance
- **Avoid / Defer (Low Impact, High Effort):** None identified

---

### 2.2 Dependency Map

```
RC-001 (No DMS)
    ├── Resolves PR-001 (Manual invoice entry) — via OCR + structured intake
    ├── Resolves PR-002 (Physical approvals) — via digital workflow engine
    ├── Resolves PR-005 (No version control) — via DMS version management
    ├── Resolves PR-006 (Shadow IT) — via governed central repository
    └── Resolves PR-007 (Physical archive) — via digital migration

RC-002 (No metadata layer)
    └── Resolves PR-003 (GDPR retention) — via automated retention rules in DMS

RC-003 (SAP 6.0 e-invoice gap)
    └── Resolves PR-004 (E-invoicing compliance) — via e-invoice middleware + DMS
```

**Conclusion:** All three root causes are resolved by deploying a DMS with SAP integration and e-invoice transformation middleware.

---

## 3. PROBLEM STATEMENTS (BABOK FORMAT)

### PS-001: AP Invoice Processing Inefficiency

> **As a** Chief Accountant managing 2,400 incoming invoices per year,  
> **I experience** 45-minute manual processing cycles and 5-day approval waits  
> **because** there is no automated OCR ingestion or digital routing capability,  
> **resulting in** €80,500/year in excess labour cost and late payment risk.

**Affected Stakeholders:** Chief Accountant, AP Team, Procurement Manager, CFO  
**Business Impact:** HIGH — direct cost, supplier relationship risk  
**KPI Baseline:** 45 min/invoice, 5-day cycle | **KPI Target:** 10 min/invoice, <1 day

---

### PS-002: GDPR Document Retention Non-Compliance

> **As a** Data Protection Officer responsible for GDPR compliance,  
> **I face** the inability to enforce automated data retention and deletion policies  
> **because** all documents are physical with no digital metadata tracking,  
> **resulting in** an unquantified regulatory fine exposure of up to €1.4M and reputational risk.

**Affected Stakeholders:** DPO/Legal, CFO, CEO  
**Business Impact:** CRITICAL — regulatory and financial  
**KPI Baseline:** 0% automated GDPR retention | **KPI Target:** 100% retention rules enforced

---

### PS-003: EU E-Invoicing Mandate Non-Compliance

> **As a** CFO responsible for regulatory compliance,  
> **I face** the inability to issue EN 16931-compliant structured invoices  
> **because** SAP ERP 6.0 only outputs PDF format,  
> **resulting in** inability to transact electronically with public sector customers by December 2026 deadline.

**Affected Stakeholders:** CFO, Sales Director, Chief Accountant  
**Business Impact:** CRITICAL — regulatory deadline; blocks €X revenue from public sector customers  
**KPI Baseline:** 0% EN 16931 compliance | **KPI Target:** 100% by December 2026

---

## 4. STRATEGIC CONTEXT

### 4.1 Do Nothing Analysis

If the company takes no action:

| Year | Consequence | Estimated Cost |
|---|---|---|
| 2025 | Continued manual processing; GDPR exposure increases | €158,660/year operational + fine risk |
| 2026 | EU e-invoicing mandate deadline — cannot invoice public sector customers | Revenue loss: unknown (% of public sector revenue) |
| 2026 | ISO 9001 re-certification audit — likely CAR for document control | €5,000–15,000 remediation |
| 2027 | GDPR enforcement action possible | €0–€1,400,000 fine |
| Ongoing | Competitive disadvantage vs digitised peers | Unquantified |

**Do Nothing NPV:** Negative — regulatory fine probability × magnitude exceeds DMS investment cost.

### 4.2 Minimal Compliance Option

Implement e-invoicing middleware only (to meet 2026 mandate) without full DMS.

| Aspect | Assessment |
|---|---|
| Cost | €40,000–80,000 for e-invoice middleware alone |
| Benefits | Resolves only PR-004 (e-invoicing compliance) |
| Unresolved problems | PR-001, PR-002, PR-003, PR-005, PR-006, PR-007 |
| Recommendation | NOT recommended — foregoes 80% of available benefit for 50% of the cost |

### 4.3 Full DMS Solution (Recommended)

| Aspect | Assessment |
|---|---|
| Cost | €150,000–300,000 (within approved budget) |
| Benefits | Resolves all 7 identified problems |
| ROI | 120%+ over 3 years; payback ≤18 months |
| Recommendation | ✅ RECOMMENDED |

---

## 5. PROBLEM DOMAIN BOUNDARIES

### In-Scope Problems for This Project

- Document digitisation and lifecycle management (DMS)
- AP invoice processing automation with OCR
- Digital approval workflows
- GDPR retention/deletion automation
- EN 16931 e-invoice output via SAP integration
- ISO 9001 document version control

### Out-of-Scope (Separate Initiatives)

- SAP ERP upgrade to S/4HANA (€1M+ separate project)
- HR document management (Q1 2027)
- CAD/PLM technical drawing management (beyond version control in DMS)
- Customer self-service portal

---

## 6. KEY RISKS AT PROBLEM DOMAIN LEVEL

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-001 | SAP 6.0 API limitations block DMS integration | Medium | HIGH | Confirm API specs in Stage 4 non-functional requirements; include SAP integration test in RFP |
| R-002 | E-invoice mandate delayed by government — reduces urgency | Low | LOW | Maintain implementation timeline regardless; benefits exist without mandate |
| R-003 | Staff resistance to digital workflows | Medium | MEDIUM | Change management plan; involve AP team in UAT design |
| R-004 | Cloud DMS provider cannot meet GDPR data residency (EU-only) | Low | HIGH | Contractual requirement: EU data residency in SLA |
| R-005 | Historical document volume underestimated | Medium | MEDIUM | Document audit in Stage 4 — count physical files per department |

---

*Prepared by: BABOK Analyst Agent v1.8.1 | Framework: BABOK® v3 | Deep Analysis Mode*
