# STAGE 4: SOLUTION REQUIREMENTS DEFINITION

**BABOK Knowledge Area:** Requirements Analysis and Design Definition, Requirements Life Cycle Management
**Model Tier:** DEEP ANALYSIS MODE (Gemini Pro 3 / Claude Opus 4.6)
**Estimated Duration:** 2-3 hours active work + 3-5 days for stakeholder validation

**CLI Command:** `babok approve <id> 4` — marks Stage 4 as approved and advances to Stage 5
**CLI Reject:** `babok reject <id> 4 -r "reason"` — rejects Stage 4 with reason

---

## Why Deep Analysis Mode

- Requirements synthesis from multiple stakeholder inputs requires careful conflict resolution
- MoSCoW prioritization involves multi-factor trade-off analysis
- Regulatory requirements must be precisely formulated — errors have legal consequences
- Traceability matrix requires systematic cross-referencing

```
[DEEP ANALYSIS MODE ACTIVATED]
Model: Gemini Pro 3 / Claude Opus 4.6
Reasoning: Requirements synthesis, conflict resolution, and regulatory precision
Context: [Root causes from Stage 3, stakeholder priorities from Stage 1, baseline from Stage 2]
```

---

## Objectives

1. Define functional requirements (FR) addressing root causes from Stage 3
2. Define non-functional requirements (NFR) for quality, performance, security
3. Write user stories with acceptance criteria for each requirement
4. Apply MoSCoW prioritization (Must/Should/Could/Won't)
5. Build Requirements Traceability Matrix (RTM)
6. Establish change control process for requirements

## Prerequisites

- Stage 3 approved (root causes identified and prioritized)
- Stakeholder availability for requirements workshops
- Regulatory requirements from Stage 1 documented

## Process

### Step 4.1: Functional Requirements Elicitation

**Assumptions:**
- Each root cause from Stage 3 maps to one or more functional requirements
- Requirements follow SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound)
- Regulatory requirements are non-negotiable MUST-HAVE items

**Evidence:**
- Stage 3: Prioritized root causes with impact-effort scores
- Stage 1: Regulatory landscape and compliance deadlines
- Stage 2: Current system capabilities and limitations

**Agent Action:** Generate initial requirements based on root cause analysis:

For each root cause, propose functional requirements:

| Root Cause | Proposed FR | Priority (initial) | Rationale |
|-----------|-------------|-------------------|-----------|
| RC-001 | FR-001: [Requirement] | MUST | [Direct solution to root cause] |
| RC-001 | FR-002: [Requirement] | SHOULD | [Supporting capability] |
| RC-002 | FR-003: [Requirement] | MUST | [Regulatory requirement] |
| ... | ... | ... | ... |

**QUESTIONS FOR HUMAN:**

1. **Requirements Validation:**
   Review the proposed functional requirements:
   - Which requirements are CORRECT as stated?
   - Which need MODIFICATION? [Specify changes]
   - Which are MISSING? [Describe additional needs]
   - Which should be REMOVED? [Explain why]

2. **Requirement Conflicts:**
   Are there conflicts between stakeholder needs?
   (e.g., Department A wants feature X, but Department B says it would cause problems)

3. **Regulatory Requirements:**
   For each regulation identified in Stage 1:
   - Are the proposed requirements SUFFICIENT for compliance?
   - Are there specific formats, schemas, or protocols required?
   - What are the testing/certification requirements?

4. **Integration Requirements:**
   - Which existing systems MUST integrate with the new solution?
   - What data must flow between systems?
   - Are there API standards or protocols to follow?

**WAIT FOR HUMAN INPUT.**

---

### Step 4.2: Non-Functional Requirements

**Assumptions:**
- Performance requirements based on user volumes from Stage 2
- Security requirements driven by data sensitivity and regulations
- Usability requirements based on user skill levels
- Availability requirements based on business criticality

**Agent Action:** Propose NFR categories:

#### Performance:
| NFR ID | Requirement | Target | Basis |
|--------|-------------|--------|-------|
| NFR-001 | Response time for standard operations | < [X] seconds | Industry benchmark |
| NFR-002 | Concurrent user support | [X] users | Stage 2 user count × 1.5 |
| NFR-003 | Batch processing throughput | [X] records/hour | Stage 2 volume data |

#### Security:
| NFR ID | Requirement | Standard | Basis |
|--------|-------------|----------|-------|
| NFR-010 | Data encryption at rest | AES-256 | [Regulation/Best practice] |
| NFR-011 | Data encryption in transit | TLS 1.3 | [Regulation/Best practice] |
| NFR-012 | Role-based access control (RBAC) | - | [Regulation/Stakeholder need] |
| NFR-013 | Audit logging | [X]-year retention | [Regulation] |

#### Availability:
| NFR ID | Requirement | Target | Basis |
|--------|-------------|--------|-------|
| NFR-020 | System uptime | [99.X]% | Business criticality |
| NFR-021 | Recovery Time Objective (RTO) | [X] hours | Risk assessment |
| NFR-022 | Recovery Point Objective (RPO) | [X] hours | Data loss tolerance |

#### Usability:
| NFR ID | Requirement | Target | Basis |
|--------|-------------|--------|-------|
| NFR-030 | Training time for standard user | < [X] hours | Stage 1 constraints |
| NFR-031 | Mobile/responsive support | [YES/NO] | User needs |

**QUESTIONS FOR HUMAN:**

1. **Performance Targets:**
   Are the proposed performance targets realistic for your environment?
   - Response time: [X seconds — OK? Adjust?]
   - Concurrent users: [X — OK? Adjust?]

2. **Availability Requirements:**
   What is your tolerance for system downtime?
   - Planned maintenance windows: [When?]
   - Maximum acceptable unplanned downtime: [X hours/month]

3. **Data Retention:**
   Legal retention requirements by document/data type:
   - [Type 1]: [X years]
   - [Type 2]: [X years]

4. **Accessibility:**
   Any specific accessibility requirements?
   (e.g., WCAG compliance, multilingual support, screen reader support)

**WAIT FOR HUMAN INPUT.**

---

### Step 4.3: User Stories with Acceptance Criteria

**Agent Action:** For each functional requirement, write user stories:

```
EPIC: [Feature Area Name]

US-001: [User Story Title]
AS A [role]
I WANT TO [action]
SO THAT [business value]

Acceptance Criteria:
- AC-01: GIVEN [precondition] WHEN [action] THEN [result]
- AC-02: GIVEN [precondition] WHEN [action] THEN [result]
- AC-03: GIVEN [error condition] WHEN [action] THEN [error handling]

Priority: [MUST/SHOULD/COULD]
Linked FR: [FR-XXX]
Linked Root Cause: [RC-XXX]
```

**QUESTIONS FOR HUMAN:**

1. **User Story Validation:**
   For each user story:
   - Are the roles correct?
   - Are the acceptance criteria complete?
   - Are there edge cases we've missed?

2. **Priority Confirmation (MoSCoW):**
   Review the MoSCoW assignment for each user story:
   - **MUST have:** Essential for go-live. Project fails without it.
   - **SHOULD have:** Important but project can launch without it (deliver in Phase 1+).
   - **COULD have:** Desirable but not critical (backlog for future phase).
   - **WON'T have (this time):** Out of scope for this project.

**WAIT FOR HUMAN INPUT.**

---

### Step 4.4: Requirements Traceability Matrix (RTM)

**Agent Action:** Build the RTM linking requirements to their sources:

| Req ID | Requirement | Source (Root Cause) | Stakeholder | Priority | User Story | Stage 5 Design | Stage 7 Risk | Stage 12 Test |
|--------|-------------|-------------------|-------------|----------|------------|----------------|-------------|---------------|
| FR-001 | [Requirement] | RC-001 | [Name] | MUST | US-001 | [TBD] | [TBD] | [TBD] |
| FR-002 | [Requirement] | RC-001 | [Name] | SHOULD | US-002 | [TBD] | [TBD] | [TBD] |
| NFR-001 | [Requirement] | Stage 2 metrics | [Name] | MUST | - | [TBD] | [TBD] | [TBD] |

---

### Step 4.5: Change Control Process

When requirements change after approval, follow this process:

1. **Change Request:** Stakeholder submits change request (CR-XXX)
2. **Impact Analysis:** BA assesses impact on scope, timeline, budget, other requirements
3. **Review:** Steering Committee reviews impact analysis
4. **Decision:** Approve / Reject / Defer
5. **Implementation:** If approved, update RTM, user stories, and affected stages
6. **Communication:** Notify all affected stakeholders

| CR ID | Description | Requested By | Impact (Scope/Time/Cost) | Decision | Decision Date |
|-------|-------------|-------------|--------------------------|----------|---------------|
| CR-001 | [Change] | [Name] | [Impact] | [Pending] | [Date] |

---

## Deliverable Template: STAGE_04_Solution_Requirements.md

```markdown
# STAGE 4: SOLUTION REQUIREMENTS DEFINITION

**Project:** [Project Name]
**Project ID:** [BABOK-YYYYMMDD-XXXX]
**Date:** [AUTO-GENERATED]
**Status:** APPROVED BY HUMAN on [DATE]

---

## EXECUTIVE SUMMARY (1 PAGE)

**Purpose of This Stage:**
Define what the solution must do (functional) and how well it must perform (non-functional).

**Key Findings:**
1. [X] functional requirements defined ([Y] MUST, [Z] SHOULD, [W] COULD)
2. [X] non-functional requirements defined (performance, security, availability, usability)
3. [X] user stories written with acceptance criteria
4. [X] requirements traced to root causes from Stage 3

**MoSCoW Summary:**
| Priority | Count | % of Total | Notes |
|----------|-------|------------|-------|
| MUST | [N] | [%] | Essential for go-live |
| SHOULD | [N] | [%] | Phase 1+ delivery |
| COULD | [N] | [%] | Future backlog |
| WON'T | [N] | [%] | Out of scope |

**Regulatory Requirements:**
- [X] compliance requirements identified as MUST-HAVE
- All traced to specific regulations from Stage 1

---

## DETAILED ANALYSIS

### 1. FUNCTIONAL REQUIREMENTS
[Full FR list with FR-001 through FR-XXX]

### 2. NON-FUNCTIONAL REQUIREMENTS
[Full NFR list]

### 3. USER STORIES BY EPIC
[All user stories with acceptance criteria]

### 4. REQUIREMENTS TRACEABILITY MATRIX
[Full RTM]

### 5. CHANGE CONTROL PROCESS
[Process definition and empty CR log]

---

## HUMAN APPROVAL

**Next Command:** `Approve 4` to proceed to Stage 5
```

---

## Quality Checklist for Stage 4

Before presenting for approval:

- [ ] Every root cause from Stage 3 has at least one corresponding FR
- [ ] Every regulatory requirement from Stage 1 has a corresponding FR (MUST priority)
- [ ] All FRs follow SMART criteria
- [ ] NFRs cover: performance, security, availability, usability, compliance
- [ ] User stories written in standard format (AS A... I WANT... SO THAT...)
- [ ] Acceptance criteria written in GIVEN-WHEN-THEN format
- [ ] MoSCoW prioritization validated by human
- [ ] RTM links every requirement to source, stakeholder, and priority
- [ ] No requirements conflict with each other
- [ ] Change control process defined
- [ ] No hallucinated requirements — all based on Stage 1-3 evidence

---

**Version:** 1.4
**Stage Owner:** Business Analyst
**BABOK Techniques Used:** Requirements Workshops, User Story Mapping, MoSCoW Prioritization, Traceability Matrix
