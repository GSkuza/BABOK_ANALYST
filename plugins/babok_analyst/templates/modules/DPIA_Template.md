# Data Protection Impact Assessment (DPIA) Template

**Project:** [Project Name]
**Regulation:** GDPR Article 35
**Applicable when:** Stage 1 identified GDPR and processing involves high risk to data subjects

---

## 1. Processing Activity Description

| Field | Value |
|-------|-------|
| Activity name | [e.g. Employee payroll in new ERP] |
| Data controller | [Company name] |
| Data processor(s) | [Vendor names] |
| Data categories | [Personal data types] |
| Data subjects | [Employees, customers, etc.] |
| Retention period | [Duration] |
| Cross-border transfer | [Yes/No — destinations] |

---

## 2. Necessity and Proportionality

**Purpose:** [Why processing is necessary]

**Legal basis (Art. 6):** [Consent / Contract / Legal obligation / Legitimate interest]

**Proportionality assessment:** [Why data collected is minimal and adequate]

---

## 3. Risk Assessment

| Risk to Data Subjects | Description | Likelihood (1–5) | Impact (1–5) | Score |
|-----------------------|-------------|------------------|--------------|-------|
| Unauthorized access | [Description] | 3 | 4 | 12 |
| Data breach during migration | [Description] | 2 | 5 | 10 |

---

## 4. Mitigation Measures

| Risk | Technical Measure | Organizational Measure | Owner | Target Date |
|------|-------------------|------------------------|-------|-------------|
| Unauthorized access | MFA, encryption at rest | Access review quarterly | IT Security | 2026-06-01 |
| Migration breach | Encrypted transfer, audit log | DPO sign-off on migration plan | DPO | 2026-08-01 |

---

## 5. Data Subject Rights

| Right | Implementation | System Support |
|-------|----------------|----------------|
| Access (Art. 15) | [Process] | [FR-XXX] |
| Erasure (Art. 17) | [Process] | [FR-XXX] |
| Portability (Art. 20) | [Process] | [FR-XXX] |

---

## 6. Residual Risk & DPO Consultation

**Residual risk score (post-mitigation):** [Score]

**DPO consultation required:** [Yes/No]
**DPO recommendation:** [Proceed / Proceed with conditions / Do not proceed]

---

## 7. Review Schedule

| Review | Frequency | Next Date | Owner |
|--------|-----------|-----------|-------|
| DPIA update | Annual or on significant change | [YYYY-MM-DD] | DPO |
