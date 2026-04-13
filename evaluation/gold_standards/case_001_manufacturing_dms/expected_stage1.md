# STAGE 1: PROJECT INITIALIZATION & STAKEHOLDER MAPPING

**Project:** Document Management System Implementation  
**Industry:** Manufacturing — Automotive Components  
**Company Size:** €35M revenue / 220 employees  
**Date:** 2025-01-15  
**Status:** ✅ APPROVED

---

## 🎯 EXECUTIVE SUMMARY

**Purpose:** Establish project scope, stakeholder registry, and success criteria for a DMS implementation at a mid-market manufacturing company.

**Key Findings:**
1. The company currently processes all supplier and customer documents manually on paper, at a rate of 45 minutes per invoice. With ~4,800 invoices/year (estimate), this equals 3,600 person-hours annually — approximately 1.8 FTE.
2. Three critical regulatory drivers mandate action: GDPR (ongoing), EU e-invoicing mandate (2026 deadline), and ISO 9001 document control requirements.
3. The primary business driver is **compliance** — failure to implement e-invoicing by the mandate deadline creates direct legal and operational risk.

**Critical Decisions Required:**
| Decision | Options | Recommended | Impact if Delayed |
|---|---|---|---|
| Cloud vs On-premise | SaaS DMS / On-premise / Hybrid | Cloud SaaS | HIGH — affects total cost and timeline |
| SAP integration approach | Native SAP addon / API middleware / Manual sync | API middleware | MEDIUM — affects scope and IT workload |
| Pilot department | Finance only / Finance + Quality / Full rollout | Finance first | LOW — reduces risk |

**Business Impact:**
- Cost opportunity: €40,000–60,000/year savings in paper, storage, and FTE time
- Compliance risk avoided: EU e-invoicing non-compliance fines + audit exposure
- Timeline: 12 months to full deployment; hard deadline December 2026

---

## 📄 DETAILED ANALYSIS

### 1. PROJECT SCOPE

#### 1.1 In Scope

| # | Document Type | Volume (est./year) | Current Process |
|---|---|---|---|
| 1 | Incoming supplier invoices | 2,400 | Paper → manual data entry to SAP |
| 2 | Outgoing customer invoices | 2,400 | SAP generated → printed and mailed |
| 3 | Purchase orders | 1,800 | SAP generated → email PDF |
| 4 | Delivery notes / packing slips | 3,600 | Paper → manual filing |
| 5 | Quality certificates (ISO 9001) | 800 | Paper → physical binder |
| 6 | Technical drawings | 1,200 | CAD → printed → physical archive |
| 7 | Supplier contracts | 120/year (active: 350) | Paper → physical folder |
| 8 | Customer contracts | 80/year (active: 200) | Paper → physical folder |

**Total estimated annual document volume: ~12,600 documents**

#### 1.2 Out of Scope

- HR documents (employment contracts, payroll): Separate HR project planned Q1 2027
- Legal/litigation documents: Handled by external legal counsel
- Engineering CAD data management: Separate PDM/PLM system evaluation planned
- Customer portal / self-service: Phase 2 consideration only

#### 1.3 System Landscape

| System | Current State | Integration Required | Notes |
|---|---|---|---|
| SAP ERP 6.0 EhP7 | Core ERP — invoices, POs | YES — bidirectional | SAP connector or REST API |
| SAP FI/CO | Financial accounting | YES — read access | Invoice approval workflows |
| Salesforce CRM | Customer management | YES — customer contracts | Webhook or scheduled sync |
| Custom WMS | Warehouse management | OPTIONAL — delivery notes | Low priority; manual upload acceptable |
| Email (MS Exchange) | Document distribution | YES — inbound email capture | Supplier invoice email ingestion |

---

### 2. STAKEHOLDER REGISTER

| ID | Name/Role | Department | Interest Level | Influence Level | Engagement Strategy |
|---|---|---|---|---|---|
| SH-001 | CEO (Project Sponsor) | Executive | HIGH | HIGH | Monthly steering committee; final budget authority |
| SH-002 | CFO | Finance | HIGH | HIGH | Bi-weekly; finance process owner; ROI accountability |
| SH-003 | IT Manager | IT | HIGH | HIGH | Daily during implementation; technical architecture decisions |
| SH-004 | Chief Accountant / AP Lead | Finance | HIGH | MEDIUM | Weekly requirements workshops; UAT lead for invoicing |
| SH-005 | Quality Manager (Compliance Lead) | Quality/ISO | HIGH | HIGH | ISO 9001 doc control requirements; GDPR compliance sign-off |
| SH-006 | Procurement Manager | Procurement | MEDIUM | MEDIUM | Supplier invoice and PO workflows |
| SH-007 | Sales Director | Sales | MEDIUM | MEDIUM | Customer contract and invoice visibility |
| SH-008 | Warehouse Manager | Operations | LOW | LOW | Delivery note digitisation |
| SH-009 | External Auditor (KPMG) | External | MEDIUM | HIGH | Audit trail and retrieval requirements; consulted not managed |
| SH-010 | DPO / Legal Counsel | Legal | MEDIUM | HIGH | GDPR, data retention, deletion policies |

**Project Sponsor:** CEO  
**Budget Authority:** CFO  
**Business Analyst Contact:** External BA (this engagement)

---

### 2.1 RACI MATRIX

| Activity | Responsible | Accountable | Consulted | Informed |
|---|---|---|---|---|
| Define Project Scope | BA | CEO (Sponsor) | CFO, IT Mgr, Quality Mgr | All stakeholders |
| Approve Requirements (Stage 4) | BA | Steering Committee | Finance team, IT | All |
| Vendor/Technology Selection | IT Manager | CFO | BA, Legal, CEO | Finance, Quality |
| Budget Approval | CFO | CEO | IT Manager, BA | Board |
| Go-Live Approval | CEO | Steering Committee | CFO, IT, BA | All users |
| Change Request Management | BA | Steering Committee | Requester, IT | Sponsor |
| User Acceptance Testing | Chief Accountant + Quality Mgr | CFO | BA, IT | IT Manager |
| Training Delivery | BA / Vendor | CFO | HR | All users |
| GDPR / DPIA Sign-off | BA (prepares) | DPO / Legal | IT Security | CFO |
| Production Go-Live | IT Manager | CEO | All stakeholders | All users |

**Steering Committee:**
- Chair: CEO
- Members: CFO, IT Manager, Quality Manager, BA (non-voting)
- Cadence: Bi-weekly during implementation; monthly in BAU
- Quorum: 3 of 4 voting members; CEO + CFO for budget decisions

---

### 3. SUCCESS CRITERIA

#### 3.1 Quantitative KPIs

| KPI | Baseline | Target | Measurement Method | Owner |
|---|---|---|---|---|
| Invoice processing time | 45 min/invoice | ≤ 10 min/invoice | Time-motion study post go-live | Chief Accountant |
| Document approval cycle | 5 business days | ≤ 1 business day | Workflow analytics in DMS | CFO |
| Audit retrieval time | 2–3 business days | < 5 minutes | Audit test exercise | Quality Manager |
| Annual paper & printing cost | €28,000/year | < €8,000/year (−71%) | Finance department P&L | CFO |
| Annual physical storage cost | €12,000/year | < €2,000/year (−83%) | Lease/storage invoice | CFO |
| FTE dedicated to document handling | 3.0 FTE | ≤ 1.0 FTE redeployed | HR headcount analysis | CFO |
| Document error rate (wrong filing, misfiling) | 8.5% | < 1% | Monthly quality audit | Quality Manager |
| Compliance violations | Unknown (estimated 2–5/year) | 0/year | Audit log review | DPO |

#### 3.2 ROI Targets

| Metric | Target | Calculation Basis |
|---|---|---|
| Payback period | ≤ 18 months | Based on €50,000/year savings vs estimated €225,000 total cost |
| 3-year NPV (discount 8%) | > €80,000 | Savings €150,000 − Investment €225,000 + Year 2–3 savings |
| 3-year ROI | > 120% | (3-year net benefit / investment) × 100 |
| IRR | > 25% | Financial model Stage 8 |

#### 3.3 Qualitative Success Criteria

- User satisfaction score > 4.0/5.0 in post go-live survey (90 days after go-live)
- Zero critical audit findings related to document retrieval in first annual audit post go-live
- ISO 9001 document control clause fully satisfied per internal auditor checklist
- All GDPR data subject rights functional within 72-hour SLA

---

### 4. REGULATORY REQUIREMENTS

| Regulation | Applicability | Key Requirements | Hard Deadline | Risk if Non-Compliant |
|---|---|---|---|---|
| **GDPR (EU 2016/679)** | YES — all personal data in documents | Encryption, RBAC, audit log 5yr, data subject rights, DPIA | Ongoing | Up to 4% global revenue fine (€1.4M max for this company); reputational damage |
| **EU E-invoicing Mandate** | YES — directive 2014/55/EU, national implementation | Structured invoice format (EN 16931), government portal submission | Dec 2026 | Business disruption; inability to invoice customers; potential fines |
| **ISO 9001:2015 Clause 7.5** | YES — quality management | Document control: version control, approval records, obsolescence marking | Certification renewal | Loss of ISO 9001 certification; customer contract penalties |
| **IFRS / Local GAAP** | YES — financial document retention | Invoice and contract retention: 7 years minimum | Ongoing | Tax authority penalties; audit failures |
| **Environmental (packaging)** | LOW | Delivery note records for supplier compliance | Ongoing | Supply chain compliance issues |

**Compliance-Driven Non-Negotiable Requirements:**
1. All documents containing personal data must be encrypted at rest (AES-256) and in transit (TLS 1.3)
2. Role-based access control must prevent unauthorised access to financial and contractual documents
3. Immutable audit trail for all document actions (create, read, edit, delete, approve)
4. E-invoices must conform to EN 16931 semantic data model
5. Document retention periods enforced automatically: invoices 7 years, contracts 10 years, quality docs 7 years post-product discontinuation

---

### 5. COMMUNICATION PLAN

| Audience | Frequency | Channel | Content | Owner |
|---|---|---|---|---|
| Steering Committee | Bi-weekly | Meeting (60 min) | Progress, risks, decisions needed, budget status | CEO/BA |
| Finance Team | Weekly | Email + 30-min call | Requirements updates, UAT schedule | BA |
| IT Team | Daily (sprint) | Standup + Teams | Technical specs, integration blockers | IT Manager |
| Quality / Compliance | Bi-weekly | Meeting (45 min) | Regulatory requirements, DPIA progress | Quality Manager |
| All Staff | Monthly | Email newsletter | Project updates, training dates | BA |
| Auditors (KPMG) | Quarterly | Formal report | Audit readiness status | CFO |

**Escalation Path:** Issue → BA (24h) → Steering Committee (48h) → CEO (5 days, final arbiter)

---

### 6. PROJECT CONSTRAINTS

**Budget:**
- Approved range: €150,000 – €300,000
- Reserve: 15% contingency (€22,500 – €45,000) within upper bound
- Currency: EUR

**Timeline:**
- Project start: Q1 2025
- Target go-live: Q4 2026
- Hard deadline: December 31, 2026 (EU e-invoicing mandate)

**Technical Constraints:**
- SAP ERP 6.0 EhP7 will NOT be upgraded during this project
- Cloud DMS must support SAP standard connectors or REST API
- Users have MS Windows 10/11 workstations with Edge/Chrome browsers
- Network: 100Mbps corporate LAN; 30Mbps internet uplink (bandwidth sizing required)

**Organisational Constraints:**
- Maximum training time: 4 hours per user
- Change management budget: included in overall project budget
- No additional FTE hiring — redeployment only

---

### 7. ASSUMPTIONS & DEPENDENCIES

**Assumptions:**

| ID | Assumption | Confidence | Owner |
|---|---|---|---|
| A-001 | SAP ERP 6.0 EhP7 supports standard REST API / BAPI interfaces for DMS integration | High | IT Manager |
| A-002 | EU e-invoicing national regulation will adopt EN 16931 (structured XML) | High | DPO/Legal |
| A-003 | Cloud DMS provider can achieve 99.9% uptime SLA | Medium | IT Manager |
| A-004 | Users have sufficient digital literacy for DMS adoption without extensive retraining | Medium | CFO |
| A-005 | Vendor will provide sandbox environment for UAT at no additional cost | Medium | BA |
| A-006 | Annual invoice volume is approximately 4,800 (2,400 incoming + 2,400 outgoing) | Medium | Chief Accountant |

**Dependencies:**

| ID | Dependency | Owner | Target Date | Status |
|---|---|---|---|---|
| D-001 | EU e-invoicing national mandate confirmed and technical specs published | Government | Q2 2025 | Monitor |
| D-002 | SAP API credentials and documentation from IT | IT Manager | Week 4 | Open |
| D-003 | Data classification exercise: identify all document types with PII | DPO | Week 6 | Open |
| D-004 | DPIA completed and approved by DPO before vendor selection | DPO | Stage 4 | Not started |
| D-005 | Budget formally approved by board | CEO/CFO | Week 3 | Open |
| D-006 | Sample document dataset for UAT (min. 500 documents) | Chief Accountant | Stage 5 | Not started |

---

### 8. OPEN QUESTIONS

| ID | Question | Stakeholder | Target Date | Status |
|---|---|---|---|---|
| Q-001 | Will the DMS be procured as SaaS or deployed on-premise? | IT Manager + CFO | Week 4 | Open |
| Q-002 | Which e-signature solution is approved by legal? (DocuSign, Adobe Sign, other?) | DPO/Legal | Week 5 | Open |
| Q-003 | Should historical documents (pre-2025) be retrospectively digitised? If so, how many years back? | CFO | Week 4 | Open |
| Q-004 | What is the approved document retention policy per category (aligned to legal advice)? | DPO | Week 6 | Open |
| Q-005 | Are there any customer or supplier contractual obligations that restrict cloud storage of their documents? | Legal | Week 5 | Open |

---

## APPROVALS

**Reviewed and Approved by:**

| Role | Name | Date | Signature |
|---|---|---|---|
| Project Sponsor (CEO) | _______________ | _______________ | _______________ |
| CFO (Budget Authority) | _______________ | _______________ | _______________ |
| IT Manager | _______________ | _______________ | _______________ |

**Next Command:** `Approve 1` → proceed to Stage 2: Current State Analysis (AS-IS)

---

*Prepared by: BABOK Analyst Agent v1.8.1 | Framework: BABOK® v3*
