# STAGE 2: CURRENT STATE ANALYSIS (AS-IS)

**Project:** Document Management System Implementation  
**Industry:** Manufacturing  
**Date:** 2025-01-22  
**Status:** ✅ APPROVED

---

## 🎯 EXECUTIVE SUMMARY

The current state analysis reveals a heavily paper-dependent document ecosystem generating measurable operational inefficiencies and material regulatory exposure. Three findings stand out:

1. **Labour Cost**: 3 FTE (~€130,000/year in loaded salary) spend >60% of their time on document handling activities that offer zero strategic value and are directly automatable.
2. **Process Bottleneck**: The 5-day invoice approval cycle delays payment to suppliers and creates cash-flow friction — the industry benchmark is same-day to 24-hour automated processing.
3. **Compliance Gap**: No documented GDPR-compliant data retention or deletion policy exists. The ISO 9001 document control procedure is partially manual and relies on individual discipline rather than system enforcement.

**Key AS-IS Metrics:**

| Metric | Current Value | Industry Benchmark | Gap |
|---|---|---|---|
| Invoice processing time | 45 min | 5–10 min (automated) | −35–40 min |
| Approval cycle | 5 days | <1 day | −4 days |
| Error rate | 8.5% | <1% | −7.5 pp |
| Audit retrieval | 2–3 days | <5 min | −2–3 days |
| Document storage cost | €40,000/year | €5,000/year | −€35,000 |

---

## 1. CURRENT PROCESS INVENTORY

### 1.1 Incoming Supplier Invoice Process (AS-IS)

**Process Name:** AP Invoice Processing  
**Owner:** Chief Accountant / AP Team (2 FTE)  
**Volume:** ~2,400 invoices/year (avg. 200/month)  
**Current Cycle Time:** 5 business days average (range: 1–15 days)

**Step-by-Step Flow:**

| Step | Activity | Actor | Duration | Pain Points |
|---|---|---|---|---|
| 1 | Invoice received by post or email | AP Clerk | 5 min | Email invoices printed; no central inbox |
| 2 | Manual data entry into SAP FI | AP Clerk | 20 min | High error rate (8.5%); duplicate entries |
| 3 | Physical invoice stamped and dated | AP Clerk | 2 min | Physical stamp availability; lost stamps |
| 4 | Invoice routed to cost centre manager for approval | AP Clerk | 10 min | Physical routing; managers not in office |
| 5 | Manager reviews and signs | Manager | 0.5–3 days | No status visibility; approvals lost |
| 6 | Signed invoice returned to AP | Courier/Post | 1–2 days | Physical transport delays |
| 7 | Approved invoice filed in physical binder | AP Clerk | 5 min | Storage capacity limits; filing errors |
| 8 | Payment scheduled in SAP | AP Clerk | 3 min | Manual; prone to double-payment risk |

**Total cycle: ~45 minutes active work + 3–5 days waiting**

**Identified Pain Points:**
- P-001: Email invoices require printing before processing — digital originals discarded
- P-002: No vendor deduplication check — 2–3 duplicate invoices processed per month
- P-003: Physical routing means approvals queue behind managers' travel schedules
- P-004: Filed invoices cannot be found quickly — average retrieval 25 minutes
- P-005: No three-way PO match automation — manual comparison to purchase order

---

### 1.2 Outgoing Customer Invoice Process (AS-IS)

**Process Name:** AR Invoice Generation  
**Owner:** Sales / Chief Accountant  
**Volume:** ~2,400 invoices/year  
**Current Cycle Time:** 2 business days from order confirmation to invoice

| Step | Activity | Actor | Duration | Pain Points |
|---|---|---|---|---|
| 1 | Sales order confirmed in SAP SD | Sales Rep | — | |
| 2 | Invoice generated in SAP FI | AP Clerk | 5 min | Manual trigger; batched daily |
| 3 | Invoice printed (2 copies) | AP Clerk | 2 min | Paper and toner cost |
| 4 | Envelope, stamp, post | Receptionist | 5 min | Postage cost €0.90/invoice = €2,160/year |
| 5 | Copy filed in physical AR binder | AP Clerk | 3 min | Filing errors; no OCR |
| 6 | Customer receipt confirmation | Customer | 3–5 days | No read confirmation |

**EU e-invoicing impact:** Current SAP FI output is PDF — NOT compliant with EN 16931 structured format required by 2026 mandate. Remediation required before deadline.

---

### 1.3 Quality Document Process (AS-IS)

**Process Name:** ISO 9001 Document Control  
**Owner:** Quality Manager  
**Volume:** ~2,000 quality documents active; ~800 new/year

| Issue | Description | Risk |
|---|---|---|
| QD-001 | Technical drawings stored in physical archive only — no digital backup | HIGH — loss risk from fire/flood; production errors from outdated versions |
| QD-002 | Document approval signatures on paper — not tracked in any system | MEDIUM — ISO 9001 Clause 7.5.2 requires evidence of approval |
| QD-003 | Superseded documents not reliably removed from workstations | HIGH — production workers may use obsolete specs |
| QD-004 | No automated notification when quality document expires or needs review | MEDIUM — manual calendar reminders (spreadsheet) unreliable |

---

## 2. PROCESS MAP (BPMN Summary)

### Swim-lane Overview: Invoice Processing AS-IS

```
┌─────────────────────────────────────────────────────────────────────┐
│ SUPPLIER    │ Send invoice (email/post)                              │
├─────────────┤                                                         │
│ AP CLERK    │ Receive → Print → Enter SAP → Route physically        │
├─────────────┤                                                         │
│ MANAGER     │ ─────────────────────── Review & Sign ──────────────  │
├─────────────┤                                                         │
│ AP CLERK    │ File physical copy → Schedule payment in SAP           │
└─────────────────────────────────────────────────────────────────────┘

Elapsed time including waiting: 3–5 business days
Active work time: ~45 minutes
Value-add ratio: ~15%
```

---

## 3. ROOT CAUSE ANALYSIS

### 3.1 Fishbone Diagram Summary (Ishikawa)

**Problem Statement:** Invoice processing takes 45 minutes and 5 days cycle time.

| Category | Root Causes Identified |
|---|---|
| **People** | AP clerks manually transcribe data already in digital form; managers not mobile-approvals enabled |
| **Process** | Physical routing creates mandatory waiting; no SLA on approvals; no escalation path |
| **Technology** | SAP does not route invoices for approval; no DMS; no OCR ingestion capability |
| **Materials** | Paper invoices require physical handling; no structured e-invoice format from suppliers |
| **Measurement** | No KPIs tracked for AP cycle time; no SLA dashboards |
| **Environment** | Physical archive fills up; no climate control in storage room (document degradation risk) |

---

## 4. COST ANALYSIS (AS-IS)

### 4.1 Annual Cost of Document Handling

| Cost Category | Annual Cost (EUR) | Basis |
|---|---|---|
| AP staff time (invoice processing) | €72,000 | 2 FTE @ €45,000 loaded cost × 80% time on invoices |
| Filing/archiving staff | €36,000 | 1 FTE @ €36,000 loaded cost × 100% time on archiving |
| Paper, printing, toner | €28,000 | Procurement actual spend 2024 |
| Physical document storage | €12,000 | Offsite archive lease 2024 |
| Postage (outgoing invoices) | €2,160 | 2,400 × €0.90 |
| Error correction (re-processing) | €8,500 | 8.5% error rate × 2,400 invoices × 25 min × €20/hr |
| **TOTAL ANNUAL COST** | **€158,660** | |

### 4.2 Hidden Costs (Quantified)

| Hidden Cost | Estimate | Notes |
|---|---|---|
| Late payment penalties (delayed approvals) | €3,000–8,000/year | Supplier terms 30 days; avg. 5-day delay adds risk |
| ISO 9001 audit finding remediation | €5,000–15,000 | Per finding resolution cost (consultancy + time) |
| GDPR non-compliance exposure | €0–€1.4M | Fine range 0–4% global revenue; currently unquantified |

---

## 5. STAKEHOLDER PAIN POINTS (ELICITATION RESULTS)

### 5.1 Finance Team (Chief Accountant Interview)

*"We spend more time filing paper than doing actual accounting. When the auditors come, we spend a full week pulling files. Last year we couldn't find 3 invoices — that cost us a week's investigation and a qualified audit note."*

**Key Pain Points:**
- Cannot work remotely because physical files are needed
- Year-end close extended by 2 days due to manual document reconciliation
- No visibility into approval status — must chase managers by phone

### 5.2 Quality Manager Interview

*"The ISO 9001 auditors flagged our document control three times in the last two years. We're always one audit finding away from a CAR. The real risk is a superseded drawing getting onto the factory floor."*

**Key Pain Points:**
- Engineers work from printed drawings — cannot guarantee they have latest revision
- No system to recall obsolete documents once distributed
- Certificate of conformance manually typed, printed, and signed — creates delays for customer shipments

### 5.3 IT Manager Interview

*"SAP is our backbone but it has no document management capability beyond basic attachment. Any DMS we choose must integrate via SAP's standard interfaces — we can't afford a custom integration project."*

**Key Pain Points:**
- Shadow IT proliferation: 4 different SharePoint document libraries created by departments (not governed)
- No disaster recovery plan for physical document archive
- SAP upgrade blocked until DMS integration is confirmed

---

## 6. SYSTEM ASSESSMENT

### 6.1 Current System Gaps

| System | Capability | Gap |
|---|---|---|
| SAP ERP 6.0 | Invoice management, PO, SD | No document repository; no approval workflow; no OCR |
| SAP FI/CO | Financial accounting | Cannot generate EN 16931 structured e-invoices without add-on or replacement |
| Salesforce CRM | Customer data | No document storage; contracts referenced by ID only |
| Custom WMS | Warehouse ops | No integration with AP; delivery notes scanned ad-hoc |
| SharePoint (shadow IT) | Ad-hoc file sharing | 4 unmanaged instances; no retention policy; no access audit |

### 6.2 Data Quality Assessment

| Data Source | Completeness | Accuracy | Consistency |
|---|---|---|---|
| SAP invoice data | 95% | 91.5% (8.5% entry errors) | High (SAP enforced) |
| Physical archive index | 60% | Unknown | Low (manual) |
| Quality document register | 75% | 80% | Medium |
| Salesforce contract records | 85% | 90% | Medium |

---

## 7. BENCHMARK COMPARISON

| Metric | This Company | Manufacturing Industry Median | Best-in-Class |
|---|---|---|---|
| Invoice processing time | 45 min | 15–20 min | 3–5 min (fully automated) |
| Approval cycle | 5 days | 2–3 days | <4 hours (digital) |
| Invoice error rate | 8.5% | 3–5% | <0.5% |
| Document retrieval time | 2–3 days | 30 min | <1 min (DMS search) |
| Annual document cost as % revenue | 0.45% | 0.2% | 0.05% |

---

## 8. SUMMARY OF PROBLEMS TO ADDRESS IN STAGE 3

| ID | Problem | Severity | Cost Impact |
|---|---|---|---|
| PR-001 | Manual invoice data entry — no OCR or structured input | HIGH | €72,000/year |
| PR-002 | Physical routing for approvals — no digital workflow | HIGH | €36,000/year delay cost |
| PR-003 | No GDPR-compliant retention/deletion automation | CRITICAL | Regulatory fine risk |
| PR-004 | Outgoing invoices not EN 16931 compliant | CRITICAL | E-invoicing mandate 2026 |
| PR-005 | No version control for technical drawings | HIGH | Production error risk |
| PR-006 | Shadow IT SharePoint proliferation | MEDIUM | Governance risk |
| PR-007 | Physical archive — no DR, degradation risk | MEDIUM | €12,000/year cost |

---

*Prepared by: BABOK Analyst Agent v1.8.1 | Framework: BABOK® v3*
