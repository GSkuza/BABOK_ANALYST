# STAGE 5: FUTURE STATE DESIGN (TO-BE)

**Project:** Document Management System Implementation  
**Industry:** Manufacturing  
**Date:** 2025-03-05  
**Status:** ✅ APPROVED

---

## 🎯 EXECUTIVE SUMMARY

The TO-BE state describes a cloud-based, SAP-integrated Document Management System that eliminates all seven AS-IS pain points within a 12-month implementation timeline. The future state architecture centres on three pillars:

1. **Automated Ingestion Hub**: All documents (email, scan, upload) captured, OCR-processed, and classified automatically
2. **Digital Workflow Engine**: Approval routing, SLA enforcement, and escalation replacing physical paper routing
3. **Compliance-First Repository**: GDPR retention automation, EN 16931 e-invoice generation, and ISO 9001 version control built in from day one

**TO-BE Key Metrics:**

| Metric | AS-IS | TO-BE Target | Improvement |
|---|---|---|---|
| Invoice processing time | 45 min | 8 min | −82% |
| Approval cycle | 5 days | 4 hours | −97% |
| Document retrieval | 2–3 days | < 30 sec | −99.9% |
| Error rate | 8.5% | < 0.5% | −94% |
| Annual document cost | €158,660 | €62,000 | −€96,660 |
| FTE on document handling | 3.0 | 0.5 | −2.5 FTE redeployed |

---

## 1. SOLUTION ARCHITECTURE

### 1.1 Conceptual Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SOURCES                                  │
│  Email (invoices@)   Supplier Portal   Scan/Upload   SAP FI output  │
└────────────┬──────────────┬──────────────┬─────────────┬────────────┘
             │              │              │             │
             ▼              ▼              ▼             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    INGESTION & CLASSIFICATION                         │
│   Email parser   OCR Engine (Azure Form Recogniser / ABBYY)          │
│   AI Classifier  Metadata Extraction  Validation                     │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    CORE DMS PLATFORM (Cloud SaaS)                    │
│   Document Repository    Workflow Engine    Search Index             │
│   Version Control        Retention Engine   Audit Logger             │
│   RBAC                   Legal Hold         KPI Dashboard            │
└────────────┬──────────────┬──────────────────────────────────────────┘
             │              │
      ┌──────┘              └──────┐
      ▼                           ▼
┌───────────┐              ┌──────────────────┐
│  SAP ERP  │◄────────────►│ E-Invoice        │
│  6.0 FI   │              │ Transformation   │
│  MM / SD  │              │ (EN 16931 XML)   │
└───────────┘              └──────────────────┘
                                   │
                                   ▼
                         National E-Invoice Portal
```

### 1.2 Technology Selection Criteria

| Criterion | Weight | Notes |
|---|---|---|
| SAP 6.0 native connector | 30% | Must-Have; eliminates custom integration risk |
| GDPR EU data residency | 25% | Non-negotiable; vendor must provide EU DPA |
| EN 16931 e-invoice support | 20% | Mandate compliance |
| TCO over 3 years (within budget) | 15% | €150K–300K ceiling |
| Usability / adoption risk | 10% | Change management impact |

**Shortlisted Vendors (to be evaluated in RFP):** DocuWare, M-Files, OpenText, Alfresco, Microsoft SharePoint Premium (with compliance add-on)

---

## 2. TO-BE PROCESS DESIGNS

### 2.1 Incoming Supplier Invoice Process (TO-BE)

**Target Cycle Time: ≤ 8 minutes active work + ≤ 4 hours waiting for approval**

| Step | Activity | Actor | Duration | System Support |
|---|---|---|---|---|
| 1 | Invoice arrives (email/scan/EDI) | Supplier / AP Inbox | 0 min | Email capture auto-triggered |
| 2 | OCR extraction + PO three-way match | DMS (automated) | 2 min | AI extraction; SAP PO pull |
| 3 | Auto-approval if match rate >95% and amount ≤€500 | DMS (rules engine) | 0 min | Configurable threshold |
| 4 | Digital routing to approver (exceptions and >€500) | DMS workflow | 1 min | Email notification + mobile |
| 5 | Approver reviews on mobile and clicks Approve/Reject | Manager | Avg. 2 min | One-click approval |
| 6 | Approved data pushed to SAP FI automatically | DMS→SAP integration | 3 min | REST API / BAPI |
| 7 | Original document stored, indexed, linked to SAP record | DMS | <1 min | Automatic |
| **Total** | | | **≤8 min active / ≤4 hr wait** | |

**Exception Handling:**
- OCR confidence <85%: Routed to AP Clerk verification queue
- Three-way match discrepancy >€5: Routed to Procurement for vendor query
- Approval SLA breach (24h): Escalated to department head automatically
- SAP sync failure: Exception queue; IT alerted; manual sync available

---

### 2.2 Outgoing Customer Invoice Process (TO-BE)

| Step | Activity | Actor | Duration |
|---|---|---|---|
| 1 | Invoice created in SAP FI (no change) | AP Clerk | 2 min |
| 2 | DMS pulls invoice data from SAP FI automatically | DMS | <1 min |
| 3 | EN 16931 XML generated and validated against XSD schema | E-invoice engine | 1 min |
| 4 | XML submitted to national e-invoice portal | DMS | 1 min |
| 5 | Receipt (UPO/timestamp) received and stored | DMS | <1 min |
| 6 | PDF copy emailed to customer + stored in DMS | DMS | 1 min |
| **Total** | | | **≤6 min; zero manual steps** | |

---

### 2.3 Quality Document Control Process (TO-BE)

| Step | Activity | Improvement Over AS-IS |
|---|---|---|
| Document creation | Author creates in MS Word/Office; uploads to DMS | Central storage; no local saves |
| Review cycle | DMS routes automatically to reviewer list | No manual coordination |
| Approval | Electronic signature captured in DMS | Replaces physical signature |
| Publication | Document published in DMS; all users notified | Push notification; supercedes previous version |
| Obsolescence | Previous version automatically marked obsolete; download requires confirmation | Replaces manual recall process |
| Review reminder | DMS sends reminder 30 days before review date | Replaces spreadsheet calendar |

---

## 3. ORGANISATIONAL CHANGES

### 3.1 Role Changes

| Current Role | TO-BE Role | Change Description |
|---|---|---|
| AP Clerk (2 FTE — 80% document handling) | AP Analyst (2 FTE — 20% exception handling, 60% freed) | Redeploy 1.2 FTE to financial analysis and reporting |
| Archive Clerk (1 FTE — 100% filing) | Office Administrator (0.3 FTE DMS exceptions) | Redeploy 0.7 FTE to reception/customer service |
| Quality Manager (30% document control) | Quality Manager (5% DMS governance) | Free 25% for quality improvement projects |
| IT Manager (10% supporting shadow IT) | IT Manager (5% DMS admin) | Shadow IT eliminated |

**Net FTE Redeployment: 2.5 FTE (not headcount reduction — redeployment to value-add work)**

### 3.2 Change Management Plan

| Phase | Activity | Timing | Owner |
|---|---|---|---|
| Awareness | Town hall: Why DMS, what changes | Month 1 | CEO + CFO |
| Engagement | Department champions identified (1 per dept) | Month 2 | BA |
| Training | Role-specific training (4h max per user) | Month 9–11 | BA + Vendor |
| Go-live support | Help desk, super-users available for 30 days | Month 12 | IT + Champions |
| Reinforcement | 90-day survey, KPI review, lessons learned | Month 15 | CFO + BA |

---

## 4. DATA MIGRATION PLAN

### 4.1 Historical Document Migration

| Category | Volume Estimate | Migration Priority | Method |
|---|---|---|---|
| Physical invoices (last 7 years) | ~33,600 invoices | HIGH (legal retention) | Scanning service (outsourced) |
| Quality certificates (last 5 years) | ~4,000 docs | HIGH (ISO 9001) | Scanning + Quality Manager validation |
| Active supplier contracts | ~350 | HIGH | Scanning + Legal review |
| Active customer contracts | ~200 | HIGH | Scanning + Legal review |
| Technical drawings (active products) | ~1,200 | MEDIUM | CAD team exports PDF versions |
| Archived POs (last 3 years) | ~5,400 | LOW | SAP extract (digital) |
| **Total estimated** | ~44,750 documents | | |

**Migration Timeline:** Months 3–8 (parallel to DMS configuration)  
**Estimated Cost:** €15,000–25,000 (scanning service + internal QA time)

### 4.2 Migration Quality Criteria

- 100% of documents with legal retention requirements scanned and validated
- Metadata accuracy > 95% verified by document owner sampling (5% sample per category)
- Zero documents lost (inventory reconciliation against physical count pre and post)

---

## 5. INTEGRATION DESIGN

### 5.1 SAP Integration

| Interface | Direction | Method | Frequency | Data |
|---|---|---|---|---|
| Invoice header + lines | DMS → SAP FI | BAPI_ACC_INVOICE_RECEIPT or REST | On approval | Vendor, amount, line items, cost centre |
| Purchase Order | SAP MM → DMS | RFC/BAPI or REST | On demand (three-way match trigger) | PO number, items, quantities, prices |
| Goods Receipt | SAP MM → DMS | Event (MIGO posting) | On posting | GR reference, matched items |
| Outgoing invoice | SAP FI → DMS | Scheduled pull (every 15 min) | Scheduled | Invoice data for EN 16931 generation |
| Payment confirmation | SAP FI → DMS | Event on F110 posting | On posting | Payment reference, date, amount |

**Integration Error Handling:** All failed integrations logged in DMS exception queue. IT notified for failures not resolved within 4 hours. Manual sync UI available for IT.

---

## 6. TO-BE KPI FRAMEWORK

### 6.1 Operational KPIs (Tracked in DMS Dashboard)

| KPI | Frequency | Target | Alert Threshold |
|---|---|---|---|
| Invoice processing time (p50) | Daily | ≤8 min | >15 min |
| Approval cycle time (p90) | Daily | ≤4 hours | >8 hours |
| OCR first-pass accuracy | Weekly | ≥90% | <85% |
| SLA compliance rate (approvals on time) | Weekly | ≥95% | <90% |
| Exception queue age (max days) | Daily | ≤2 days | >3 days |

### 6.2 Compliance KPIs (Tracked by DPO/Quality Manager)

| KPI | Frequency | Target |
|---|---|---|
| GDPR data subject requests resolved within 72h | Monthly | 100% |
| Documents deleted on schedule (retention) | Monthly | 100% |
| EN 16931 submission success rate | Daily | ≥99% |
| ISO 9001 document control findings | Annual | 0 |
| Audit retrieval test (random 10 documents) | Quarterly | 100% <5 min |

---

*Prepared by: BABOK Analyst Agent v1.8.1 | Framework: BABOK® v3*
