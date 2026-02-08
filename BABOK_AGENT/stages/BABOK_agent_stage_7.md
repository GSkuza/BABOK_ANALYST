# STAGE 7: RISK ASSESSMENT & MITIGATION STRATEGY

**BABOK Knowledge Area:** Strategy Analysis, Business Analysis Planning and Monitoring
**Model Tier:** Standard Mode (with Deep Analysis for complex risk scenarios)
**Estimated Duration:** 45 minutes active work + 1 day for validation

**CLI Command:** `babok approve <id> 7` — marks Stage 7 as approved and advances to Stage 8
**CLI Reject:** `babok reject <id> 7 -r "reason"` — rejects Stage 7 with reason

---

## Objectives

1. Identify all project risks across categories
2. Assess probability and impact for each risk
3. Create risk prioritization matrix
4. Define mitigation strategies (avoid, transfer, mitigate, accept)
5. Assign risk owners and monitoring triggers
6. Prepare Data Protection Impact Assessment (DPIA) if GDPR applies
7. Define contingency plans for top risks

## Prerequisites

- Stages 1-6 approved (full project context available)
- Implementation roadmap from Stage 6 (timeline and phases)
- Regulatory requirements from Stage 1

## Process

### Step 7.1: Risk Identification

**Assumptions:**
- Risks span multiple categories: technical, organizational, regulatory, financial, external
- Previous stages have surfaced many risks implicitly
- Some risks are unique to this project; others are common for mid-market IT projects

**Evidence:**
- Stage 1: Constraints, dependencies, regulatory deadlines
- Stage 2: System limitations, data quality issues
- Stage 3: Problem dependencies and complexity
- Stage 5: Architecture decisions and integration complexity
- Stage 6: Implementation phases, resource constraints

**Agent Action:** Compile comprehensive risk register from all previous stages:

#### Risk Categories:

**Technical Risks:**
| Risk ID | Description | Source | Probability | Impact |
|---------|-------------|--------|------------|--------|
| R-T001 | [System integration complexity exceeds estimate] | Stage 5 | [H/M/L] | [H/M/L] |
| R-T002 | [Vendor API limitations or changes] | Stage 5 | [H/M/L] | [H/M/L] |
| R-T003 | [Data migration quality issues] | Stage 6 | [H/M/L] | [H/M/L] |
| R-T004 | [Performance does not meet NFR targets] | Stage 4 | [H/M/L] | [H/M/L] |

**Organizational Risks:**
| Risk ID | Description | Source | Probability | Impact |
|---------|-------------|--------|------------|--------|
| R-O001 | [User adoption resistance] | Stage 6 | [H/M/L] | [H/M/L] |
| R-O002 | [Key stakeholder leaves project] | Stage 1 | [H/M/L] | [H/M/L] |
| R-O003 | [Internal resource unavailability] | Stage 6 | [H/M/L] | [H/M/L] |
| R-O004 | [Scope creep from stakeholder requests] | Stage 4 | [H/M/L] | [H/M/L] |

**Regulatory/Compliance Risks:**
| Risk ID | Description | Source | Probability | Impact |
|---------|-------------|--------|------------|--------|
| R-C001 | [Regulatory deadline missed] | Stage 1 | [H/M/L] | [H/M/L] |
| R-C002 | [Compliance requirements change during project] | Stage 1 | [H/M/L] | [H/M/L] |
| R-C003 | [Data protection violation during migration] | Stage 6 | [H/M/L] | [H/M/L] |

**Financial Risks:**
| Risk ID | Description | Source | Probability | Impact |
|---------|-------------|--------|------------|--------|
| R-F001 | [Budget overrun] | Stage 1, 6 | [H/M/L] | [H/M/L] |
| R-F002 | [Vendor pricing changes] | Stage 5 | [H/M/L] | [H/M/L] |
| R-F003 | [ROI assumptions prove optimistic] | Stage 2, 3 | [H/M/L] | [H/M/L] |

**External Risks:**
| Risk ID | Description | Source | Probability | Impact |
|---------|-------------|--------|------------|--------|
| R-E001 | [Vendor goes out of business or discontinues product] | Stage 5 | [H/M/L] | [H/M/L] |
| R-E002 | [Market conditions change affecting project priority] | External | [H/M/L] | [H/M/L] |

**QUESTIONS FOR HUMAN:**

1. **Risk Completeness:**
   Review the risk register. Any risks missing based on your experience?

2. **Probability Assessment:**
   For each risk, validate the probability rating:
   - HIGH: >50% chance of occurring
   - MEDIUM: 20-50% chance
   - LOW: <20% chance

3. **Impact Assessment:**
   For each risk, validate the impact rating:
   - HIGH: Project failure, significant financial loss, regulatory penalty
   - MEDIUM: Delay >4 weeks, budget overrun >15%, partial scope reduction
   - LOW: Minor delay <2 weeks, minimal cost impact, workaround available

4. **Organization-Specific Risks:**
   Are there internal political, cultural, or historical factors that create additional risks?

**WAIT FOR HUMAN INPUT.**

---

### Step 7.2: Risk Prioritization Matrix

**Agent Action:** Create risk priority matrix:

```
HIGH IMPACT
    │
    │  ■ CRITICAL          ■ HIGH
    │  (High Prob,          (Low Prob,
    │   High Impact)         High Impact)
    │  → Immediate action   → Mitigation plan
    │
    ├─────────────────────────────────────
    │
    │  ■ MODERATE           ■ LOW
    │  (High Prob,          (Low Prob,
    │   Low Impact)          Low Impact)
    │  → Monitor closely    → Accept/Monitor
    │
LOW IMPACT
    LOW PROBABILITY ──────── HIGH PROBABILITY
```

#### Risk Priority Table:

| Priority | Risk ID | Description | Prob | Impact | Risk Score | Response Strategy |
|----------|---------|-------------|------|--------|------------|-------------------|
| 1 (CRITICAL) | [R-XXX] | [Description] | HIGH | HIGH | 9 | Mitigate |
| 2 (HIGH) | [R-XXX] | [Description] | MED | HIGH | 6 | Mitigate |
| 3 (HIGH) | [R-XXX] | [Description] | HIGH | MED | 6 | Mitigate |
| ... | ... | ... | ... | ... | ... | ... |

**Risk Scoring:** LOW=1, MEDIUM=2, HIGH=3. Score = Probability × Impact.

---

### Step 7.3: Mitigation Strategies

**Agent Action:** For each CRITICAL and HIGH risk, define mitigation:

| Risk ID | Strategy | Mitigation Actions | Owner | Trigger | Contingency |
|---------|----------|-------------------|-------|---------|-------------|
| R-XXX | **Mitigate** | 1. [Action 1] 2. [Action 2] | [Owner] | [When to escalate] | [If mitigation fails] |
| R-XXX | **Transfer** | [Transfer to vendor/insurance] | [Owner] | [Conditions] | [Fallback] |
| R-XXX | **Avoid** | [Change approach to eliminate risk] | [Owner] | N/A | N/A |
| R-XXX | **Accept** | [Monitor but no active mitigation] | [Owner] | [When to reassess] | [If risk materializes] |

**Response Strategies:**
- **Avoid:** Eliminate the risk by changing the approach
- **Transfer:** Shift risk to a third party (vendor, insurance, outsourcing)
- **Mitigate:** Reduce probability or impact through proactive actions
- **Accept:** Acknowledge risk and prepare contingency if it materializes

**QUESTIONS FOR HUMAN:**

1. **Mitigation Validation:**
   Review the proposed mitigation strategies:
   - Are the mitigation actions realistic and achievable?
   - Are the risk owners correct?

2. **Contingency Budget:**
   What contingency budget is available for risk response?
   - Financial reserve: [X% of total budget, typically 10-15%]
   - Time buffer: [X weeks added to timeline]

3. **Risk Appetite:**
   What is the organization's general risk appetite?
   - **Conservative:** Minimize all risks, accept higher costs for lower risk
   - **Moderate:** Balance risk and cost, accept calculated risks
   - **Aggressive:** Accept higher risk for faster/cheaper delivery

**WAIT FOR HUMAN INPUT.**

---

### Step 7.4: Data Protection Impact Assessment (DPIA)

**Applicability Check:**
DPIA is MANDATORY when the project involves:
- Processing personal data using new technologies
- Large-scale processing of personal data
- Systematic monitoring of individuals
- Processing sensitive/special category data

**If DPIA Required:**

```
[DEEP ANALYSIS MODE ACTIVATED]
Model: Gemini Pro 3 / Claude Opus 4.6
Reasoning: DPIA requires precise regulatory analysis under GDPR Article 35
```

#### DPIA Template:

| Section | Content |
|---------|---------|
| **Data Controller** | [Organization name] |
| **DPO Contact** | [Name/email if applicable] |
| **Processing Description** | [What personal data, why, how] |
| **Necessity & Proportionality** | [Why this processing is needed, alternatives considered] |
| **Data Subjects** | [Categories: employees, customers, suppliers, etc.] |
| **Data Types** | [Names, contact info, financial data, etc.] |
| **Legal Basis** | [Consent / Contract / Legal obligation / Legitimate interest] |
| **Retention Period** | [Per data type, aligned with legal requirements] |
| **Security Measures** | [Encryption, access control, audit logging, etc.] |
| **Risks to Individuals** | [What could go wrong for data subjects] |
| **Mitigation Measures** | [How risks are addressed] |

**QUESTIONS FOR HUMAN:**

1. **DPIA Applicability:**
   Does this project process personal data? [YES / NO]
   If YES, do you have a Data Protection Officer? [YES / NO, Name/Contact]

2. **Personal Data Types:**
   What types of personal data will the system process?
   [ ] Names and contact information
   [ ] Financial data (bank accounts, salaries)
   [ ] Health data
   [ ] Authentication data (passwords, biometrics)
   [ ] Location data
   [ ] Other: [SPECIFY]

3. **Legal Basis:**
   What is the legal basis for processing this data?
   [ ] Contractual necessity
   [ ] Legal obligation
   [ ] Legitimate interest
   [ ] Consent
   [ ] Other: [SPECIFY]

**WAIT FOR HUMAN INPUT (if DPIA applicable).**

---

## Deliverable Template: STAGE_07_Risk_Assessment.md

```markdown
# STAGE 7: RISK ASSESSMENT & MITIGATION STRATEGY

**Project:** [Project Name]
**Project ID:** [BABOK-YYYYMMDD-XXXX]
**Date:** [AUTO-GENERATED]
**Status:** APPROVED BY HUMAN on [DATE]

---

## EXECUTIVE SUMMARY (1 PAGE)

**Purpose of This Stage:**
Identify, assess, and plan mitigation for all project risks.

**Key Findings:**
1. [X] risks identified: [Y] CRITICAL, [Z] HIGH, [W] MODERATE, [V] LOW
2. Top 3 risks: [Risk 1], [Risk 2], [Risk 3]
3. DPIA: [Required/Not Required] — [Status]
4. Recommended contingency reserve: [X% of budget] + [Y weeks timeline buffer]

**Top Risks Summary:**
| # | Risk | Probability | Impact | Strategy | Owner |
|---|------|------------|--------|----------|-------|
| 1 | [Risk] | [H/M/L] | [H/M/L] | [Strategy] | [Owner] |
| 2 | [Risk] | [H/M/L] | [H/M/L] | [Strategy] | [Owner] |
| 3 | [Risk] | [H/M/L] | [H/M/L] | [Strategy] | [Owner] |

---

## DETAILED ANALYSIS

### 1. RISK REGISTER
[Full register: all risks with ID, description, probability, impact, score]

### 2. RISK PRIORITIZATION MATRIX
[Visual matrix + priority table]

### 3. MITIGATION STRATEGIES
[For each CRITICAL and HIGH risk: strategy, actions, owner, trigger, contingency]

### 4. DPIA (if applicable)
[Complete DPIA document]

### 5. RISK MONITORING PLAN
[How and when risks will be reviewed, escalation triggers]

---

## HUMAN APPROVAL

**Next Command:** `Approve 7` to proceed to Stage 8
```

---

## Quality Checklist for Stage 7

Before presenting for approval:

- [ ] Risks identified across all categories (technical, organizational, regulatory, financial, external)
- [ ] Risks sourced from all previous stages (not just generic risks)
- [ ] Probability and impact assessed for every risk
- [ ] Risk scores calculated and risks prioritized
- [ ] Mitigation strategy defined for all CRITICAL and HIGH risks
- [ ] Risk owners assigned
- [ ] Monitoring triggers and escalation paths defined
- [ ] Contingency plans for top risks
- [ ] DPIA completed (if GDPR applicable)
- [ ] Contingency budget recommendation provided
- [ ] Risk register validated by human

---

**Version:** 1.4
**Stage Owner:** Business Analyst
**BABOK Techniques Used:** Risk Analysis, SWOT Analysis, Decision Analysis, DPIA
