# Risk Register Template

**Project Name:** [Project Name]  
**Document Version:** 1.0  
**Date:** [Date]  
**Risk Manager:** [Name]  
**Review Frequency:** [Weekly | Bi-weekly | Monthly]

---

## Risk Register

| Risk ID | Category | Risk Description | Probability | Impact | Risk Score | Status | Owner | Mitigation Strategy | Contingency Plan | Current Status |
|---------|----------|------------------|-------------|---------|------------|--------|-------|---------------------|------------------|----------------|
| R-001 | Technical | [Description] | H/M/L | H/M/L | [#] | Open | [Name] | [Strategy] | [Plan] | [Status] |
| R-002 | Business | [Description] | H/M/L | H/M/L | [#] | Open | [Name] | [Strategy] | [Plan] | [Status] |
| R-003 | Resource | [Description] | H/M/L | H/M/L | [#] | Open | [Name] | [Strategy] | [Plan] | [Status] |

---

## Risk Scoring Matrix

### Probability Scale
- **High (3):** > 60% likelihood of occurrence
- **Medium (2):** 30-60% likelihood of occurrence
- **Low (1):** < 30% likelihood of occurrence

### Impact Scale
- **High (3):** Major impact on schedule, budget, or quality (>20% variance)
- **Medium (2):** Moderate impact on schedule, budget, or quality (10-20% variance)
- **Low (1):** Minor impact on schedule, budget, or quality (<10% variance)

### Risk Score Calculation
**Risk Score = Probability × Impact**

| Score | Priority | Action Required |
|-------|----------|-----------------|
| 7-9 | Critical | Immediate action and executive escalation |
| 4-6 | High | Detailed mitigation plan required |
| 2-3 | Medium | Monitor and develop response plan |
| 1 | Low | Watch list only |

---

## Risk Heat Map

```
        │ 9 │ 6 │ 3 │
High    │   │   │   │
Impact  ├───┼───┼───┤
        │ 6 │ 4 │ 2 │
Medium  │   │   │   │
Impact  ├───┼───┼───┤
        │ 3 │ 2 │ 1 │
Low     │   │   │   │
Impact  └───┴───┴───┘
         High Med Low
         Probability
```

---

## Risk Categories

### Technical Risks
- Technology maturity and reliability
- Integration complexity
- Performance and scalability concerns
- Security vulnerabilities
- Technical skill gaps

### Business Risks
- Changing business requirements
- Stakeholder alignment
- Budget constraints
- ROI realization
- Market conditions

### Resource Risks
- Resource availability
- Key person dependencies
- Team turnover
- Skill shortages
- Competing priorities

### External Risks
- Vendor reliability
- Regulatory changes
- Third-party dependencies
- Market disruptions
- Economic factors

### Project Management Risks
- Schedule delays
- Scope creep
- Communication breakdowns
- Inadequate planning
- Change management

---

## Detailed Risk Profiles

### Risk ID: R-001
**Category:** [Technical | Business | Resource | External | PM]  
**Risk Title:** [Short title]

#### Description
[Detailed description of the risk and its potential trigger]

#### Probability Assessment
- **Rating:** High | Medium | Low
- **Rationale:** [Why this probability level]
- **Indicators:** [Early warning signs]

#### Impact Assessment
- **Rating:** High | Medium | Low
- **Schedule Impact:** [Description and estimated delay]
- **Budget Impact:** [Description and estimated cost]
- **Quality Impact:** [Description of quality implications]
- **Scope Impact:** [Description of scope implications]

#### Risk Response Strategy
- **Strategy Type:** Avoid | Transfer | Mitigate | Accept
- **Rationale:** [Why this strategy]

#### Mitigation Actions
1. [Action 1] - Owner: [Name] - Due: [Date]
2. [Action 2] - Owner: [Name] - Due: [Date]
3. [Action 3] - Owner: [Name] - Due: [Date]

#### Contingency Plan
**If Risk Occurs:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Contingency Budget:** $[Amount]  
**Contingency Time:** [Duration]

#### Monitoring
- **Monitor:** [Who monitors]
- **Frequency:** [How often]
- **Metrics:** [What to track]
- **Reporting:** [How to report]

---

## Risk Action Tracking

| Risk ID | Action | Owner | Due Date | Status | Completion Date | Notes |
|---------|--------|-------|----------|--------|-----------------|-------|
| R-001 | [Action] | [Name] | [Date] | Not Started / In Progress / Complete | [Date] | [Notes] |
| R-002 | [Action] | [Name] | [Date] | Not Started / In Progress / Complete | [Date] | [Notes] |

---

## Risk Review Meeting Summary

### Meeting Date: [Date]
**Attendees:** [Names]

#### New Risks Identified
- [Risk ID and description]

#### Risks Closed
- [Risk ID and reason for closure]

#### Risks Escalated
- [Risk ID and escalation reason]

#### Risk Status Changes
- [Risk ID: change description]

#### Action Items
| Action | Owner | Due Date |
|--------|-------|----------|
| [Action] | [Name] | [Date] |

---

## Risk Trend Analysis

### Overall Risk Exposure
- **Total Active Risks:** [#]
- **Critical Risks:** [#]
- **High Priority Risks:** [#]
- **Medium Priority Risks:** [#]
- **Low Priority Risks:** [#]

### Trend
- **Increasing:** [#] risks worsening
- **Stable:** [#] risks unchanged
- **Decreasing:** [#] risks improving

### Top 5 Risks by Score
1. [Risk ID] - [Risk Title] - Score: [#]
2. [Risk ID] - [Risk Title] - Score: [#]
3. [Risk ID] - [Risk Title] - Score: [#]
4. [Risk ID] - [Risk Title] - Score: [#]
5. [Risk ID] - [Risk Title] - Score: [#]

---

## Example Risks

### Example 1: Technical Risk
**Risk ID:** R-001  
**Category:** Technical  
**Risk Description:** The third-party API we're integrating with has unstable performance during peak hours, which could impact our application's reliability.  
**Probability:** Medium (2)  
**Impact:** High (3)  
**Risk Score:** 6 (High Priority)  
**Mitigation Strategy:** Implement caching layer, add retry logic with exponential backoff, negotiate SLA with vendor  
**Contingency Plan:** If API fails completely, switch to alternative provider (Provider B) within 48 hours

### Example 2: Resource Risk
**Risk ID:** R-002  
**Category:** Resource  
**Risk Description:** The lead developer is scheduled for surgery and will be unavailable for 6 weeks during critical development phase.  
**Probability:** High (3)  
**Impact:** Medium (2)  
**Risk Score:** 6 (High Priority)  
**Mitigation Strategy:** Cross-train two other developers, document all architectural decisions, front-load critical work before absence  
**Contingency Plan:** Bring in contractor with similar skills if knowledge transfer is insufficient

### Example 3: Business Risk
**Risk ID:** R-003  
**Category:** Business  
**Risk Description:** Regulatory changes may require additional compliance features not in current scope.  
**Probability:** Low (1)  
**Impact:** High (3)  
**Risk Score:** 3 (Medium Priority)  
**Mitigation Strategy:** Monitor regulatory announcements, design system with compliance hooks, reserve 15% contingency budget  
**Contingency Plan:** Activate change request process, add compliance sprint, extend timeline by 3 weeks if needed

---

## Review & Approval

| Version | Date | Changes | Reviewed By | Approved By |
|---------|------|---------|-------------|-------------|
| 1.0 | [Date] | Initial risk register | [Name] | [Name] |
| 1.1 | [Date] | Added new risks from review | [Name] | [Name] |
