# STAGE 5: FUTURE STATE DESIGN (TO-BE)

**BABOK Knowledge Area:** Requirements Analysis and Design Definition
**Model Tier:** Standard Mode (with Deep Analysis for architecture decisions)
**Estimated Duration:** 1-2 hours active work + 2-3 days for technical validation

**CLI Command:** `babok approve <id> 5` — marks Stage 5 as approved and advances to Stage 6
**CLI Reject:** `babok reject <id> 5 -r "reason"` — rejects Stage 5 with reason

---

## Objectives

1. Design target architecture addressing all MUST and SHOULD requirements
2. Create TO-BE process maps (optimized workflows)
3. Define integration architecture (how systems connect)
4. Design data flow and data model
5. Specify technology selection criteria
6. Compare design against requirements (coverage validation)

## Prerequisites

- Stage 4 approved (functional and non-functional requirements defined)
- Technical stakeholders available for architecture validation
- System integration constraints understood

## Process

### Step 5.1: TO-BE Process Design

**Assumptions:**
- TO-BE processes eliminate bottlenecks and pain points from Stage 2
- Automation replaces manual steps where justified by ROI
- Process design aligns with industry best practices and standards

**Evidence:**
- Stage 2: AS-IS process maps with identified bottlenecks
- Stage 3: Root causes and their priority
- Stage 4: Functional requirements (what the solution must do)

**Agent Action:** For each core process mapped in Stage 2, design the optimized TO-BE version:

#### Process Comparison:

| Aspect | AS-IS (Stage 2) | TO-BE (Proposed) | Improvement |
|--------|-----------------|------------------|-------------|
| Total steps | [X] | [Y] | [Z] steps eliminated |
| Manual steps | [X] | [Y] | [Z] automated |
| Average duration | [X time] | [Y time] | [Z%] reduction |
| Departments involved | [X] | [Y] | [Simplified handoffs] |
| Systems touched | [X] | [Y] | [Consolidated/integrated] |
| Error-prone steps | [X] | [Y] | [Eliminated/mitigated] |

**QUESTIONS FOR HUMAN:**

1. **Process Automation Level:**
   For each manual step in the AS-IS process, confirm the desired automation level:
   - **Fully automated:** No human intervention needed
   - **Semi-automated:** System assists, human validates/approves
   - **Manual with system support:** Human performs but system tracks/reminds
   - **Keep manual:** No change needed

2. **Approval Workflows:**
   For processes requiring approval:
   - How many approval levels needed? [1 / 2 / 3+]
   - Approval routing rules: [By value threshold? By department? By type?]
   - What happens when approver is unavailable? [Delegate? Escalate? Wait?]

3. **Exception Handling:**
   For the main process exceptions identified in Stage 2:
   - How should the TO-BE process handle each exception?
   - What triggers an exception? What resolves it?

**WAIT FOR HUMAN INPUT.**

---

### Step 5.2: Target System Architecture

**Assumptions:**
- Architecture must fit within budget constraints from Stage 1
- Must integrate with existing systems identified in Stage 2
- Must support NFR requirements from Stage 4 (performance, security, availability)

**Evidence:**
- Stage 2: Current system landscape and integration points
- Stage 4: NFR requirements (performance targets, security standards)
- Stage 1: Budget and timeline constraints

**Agent Action:** Propose target architecture:

#### Architecture Options:

| Option | Description | Pros | Cons | Estimated Cost |
|--------|-------------|------|------|----------------|
| **Option A** | [Architecture description] | [List pros] | [List cons] | [Range] |
| **Option B** | [Architecture description] | [List pros] | [List cons] | [Range] |
| **Option C** | [Architecture description] | [List pros] | [List cons] | [Range] |

#### Architecture Components:

| Component | Purpose | Technology Options | Requirements Addressed |
|-----------|---------|-------------------|----------------------|
| [Core system] | [Purpose] | [Options] | FR-001, FR-002, ... |
| [Integration layer] | [Purpose] | [Options] | FR-XXX, NFR-XXX |
| [Data storage] | [Purpose] | [Options] | NFR-010, NFR-020 |
| [User interface] | [Purpose] | [Options] | NFR-030, NFR-031 |
| [Security layer] | [Purpose] | [Options] | NFR-010-013 |

**QUESTIONS FOR HUMAN:**

1. **Deployment Preference:**
   [ ] Cloud SaaS (vendor-hosted)
   [ ] Cloud IaaS/PaaS (self-managed in cloud)
   [ ] On-premise
   [ ] Hybrid
   Reasoning for preference: [EXPLAIN]

2. **Build vs. Buy:**
   [ ] Buy a commercial solution (COTS)
   [ ] Build custom solution
   [ ] Hybrid (buy core, customize/extend)
   Reasoning: [EXPLAIN]

3. **Architecture Option Selection:**
   Which option do you prefer? [A / B / C]
   Any modifications to the selected option?

4. **Existing System Constraints:**
   Are there any systems that MUST NOT be changed/replaced?
   Are there systems that COULD be replaced as part of this project?

**WAIT FOR HUMAN INPUT.**

---

### Step 5.3: Integration Architecture

**Agent Action:** Design integration between systems:

#### Integration Map:

| Source System | Target System | Data Exchanged | Method | Frequency | Direction |
|--------------|---------------|----------------|--------|-----------|-----------|
| [System A] | [New Solution] | [Data types] | [API/File/Event] | [Real-time/Batch] | [→ / ← / ↔] |
| [New Solution] | [System B] | [Data types] | [API/File/Event] | [Real-time/Batch] | [→ / ← / ↔] |

#### Integration Requirements:

| Integration | Protocol | Authentication | Error Handling | SLA |
|------------|----------|---------------|----------------|-----|
| [System A ↔ New] | [REST/SOAP/File] | [OAuth/API Key/Cert] | [Retry/Queue/Alert] | [Response time] |

**QUESTIONS FOR HUMAN:**

1. **API Availability:**
   For each existing system, confirm:
   - Does it have an API? [YES / NO / UNKNOWN]
   - API documentation available? [YES / NO]
   - API restrictions (rate limits, licensing)? [DESCRIBE]

2. **Integration Priority:**
   Which integrations are MUST-HAVE for go-live?
   Which can be added in a later phase?

**WAIT FOR HUMAN INPUT.**

---

### Step 5.4: Data Architecture

**Agent Action:** Design data model and flows:

#### Key Data Entities:
| Entity | Description | Source | Storage | Retention |
|--------|-------------|--------|---------|-----------|
| [Entity 1] | [Description] | [Origin system/user] | [Where stored] | [X years] |
| [Entity 2] | [Description] | [Origin system/user] | [Where stored] | [X years] |

#### Data Migration:
If migrating from existing systems:
| Source | Data Type | Volume | Migration Strategy | Validation |
|--------|-----------|--------|-------------------|------------|
| [Old system] | [Data] | [Records] | [Full/Incremental/Subset] | [How to verify] |

---

## Deliverable Template: STAGE_05_Future_State_Design.md

```markdown
# STAGE 5: FUTURE STATE DESIGN (TO-BE)

**Project:** [Project Name]
**Project ID:** [BABOK-YYYYMMDD-XXXX]
**Date:** [AUTO-GENERATED]
**Status:** APPROVED BY HUMAN on [DATE]

---

## EXECUTIVE SUMMARY (1 PAGE)

**Purpose of This Stage:**
Design the target solution architecture and optimized processes.

**Key Findings:**
1. TO-BE processes reduce [primary process] time by [X%]
2. Selected architecture: [Option chosen] — [rationale]
3. [X] system integrations required ([Y] for go-live, [Z] for Phase 2+)
4. Estimated implementation complexity: [LOW/MEDIUM/HIGH]

**Architecture Decision:**
| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Deployment | [Cloud/On-prem/Hybrid] | [Rationale] |
| Approach | [Buy/Build/Hybrid] | [Rationale] |
| Integration | [API/File/Event-based] | [Rationale] |

---

## DETAILED ANALYSIS

### 1. TO-BE PROCESS MAPS
[Optimized process for each core workflow]
[AS-IS vs TO-BE comparison tables]

### 2. TARGET SYSTEM ARCHITECTURE
[Architecture diagram description]
[Component list with technology choices]

### 3. INTEGRATION ARCHITECTURE
[Integration map with all system connections]
[Protocols, authentication, error handling]

### 4. DATA ARCHITECTURE
[Data entities, storage, retention, migration plan]

### 5. REQUIREMENTS COVERAGE
[Matrix: FR/NFR → How addressed in TO-BE design]

---

## HUMAN APPROVAL

**Next Command:** `Approve 5` to proceed to Stage 6
```

---

## Quality Checklist for Stage 5

Before presenting for approval:

- [ ] TO-BE process designed for every AS-IS process from Stage 2
- [ ] Every MUST requirement from Stage 4 addressed in the design
- [ ] Architecture decision documented with rationale
- [ ] Integration architecture covers all system connections
- [ ] Data model and migration strategy defined
- [ ] Non-functional requirements addressed (performance, security, availability)
- [ ] AS-IS vs TO-BE comparison shows measurable improvement
- [ ] Architecture options presented with pros/cons (not just one option)
- [ ] Technical feasibility validated with IT stakeholder
- [ ] Design fits within budget and timeline constraints from Stage 1

---

**Version:** 1.4
**Stage Owner:** Business Analyst
**BABOK Techniques Used:** Process Modeling, Data Modeling, Prototyping, Gap Analysis, Decision Analysis
