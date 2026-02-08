# STAGE 6: GAP ANALYSIS & IMPLEMENTATION ROADMAP

**BABOK Knowledge Area:** Strategy Analysis, Solution Evaluation
**Model Tier:** DEEP ANALYSIS MODE (Gemini Pro 3 / Claude Opus 4.6)
**Estimated Duration:** 1 hour active work + 1 day for validation

**CLI Command:** `babok approve <id> 6` — marks Stage 6 as approved and advances to Stage 7
**CLI Reject:** `babok reject <id> 6 -r "reason"` — rejects Stage 6 with reason

---

## Why Deep Analysis Mode

- Strategic roadmap requires balancing multiple constraints (time, cost, risk, dependencies)
- Phasing decisions involve complex trade-offs
- Resource allocation optimization across competing priorities
- Dependency chains determine critical path

```
[DEEP ANALYSIS MODE ACTIVATED]
Model: Gemini Pro 3 / Claude Opus 4.6
Reasoning: Roadmap planning requires multi-constraint optimization and strategic trade-off analysis
Context: [AS-IS from Stage 2, TO-BE from Stage 5, requirements from Stage 4, constraints from Stage 1]
```

---

## Objectives

1. Systematically compare AS-IS state with TO-BE design (gap matrix)
2. Define implementation phases with clear milestones
3. Allocate resources and estimate effort per phase
4. Create change management plan
5. Define training plan
6. Establish go-live criteria

## Prerequisites

- Stage 5 approved (TO-BE architecture and processes designed)
- Budget constraints confirmed (Stage 1)
- Resource availability known

## Process

### Step 6.1: Gap Analysis Matrix

**Assumptions:**
- Every gap between AS-IS and TO-BE requires an action to close
- Gaps vary in complexity, cost, and time to close
- Some gaps have dependencies on others

**Evidence:**
- Stage 2: AS-IS state (processes, systems, metrics)
- Stage 5: TO-BE design (target processes, architecture)
- Stage 4: Requirements that must be met

**Agent Action:** Create comprehensive gap matrix:

| Gap ID | Area | AS-IS State | TO-BE State | Gap Description | Effort | Dependencies |
|--------|------|------------|-------------|-----------------|--------|-------------|
| GAP-001 | Process | [Current] | [Target] | [What needs to change] | [S/M/L/XL] | [None / GAP-XXX] |
| GAP-002 | Technology | [Current] | [Target] | [What needs to change] | [S/M/L/XL] | [None / GAP-XXX] |
| GAP-003 | People/Skills | [Current] | [Target] | [What needs to change] | [S/M/L/XL] | [None / GAP-XXX] |
| GAP-004 | Data | [Current] | [Target] | [What needs to change] | [S/M/L/XL] | [None / GAP-XXX] |
| GAP-005 | Compliance | [Current] | [Target] | [What needs to change] | [S/M/L/XL] | [None / GAP-XXX] |

**Effort Sizing:**
- **S (Small):** < 1 week, 1 person, minimal risk
- **M (Medium):** 1-4 weeks, 1-2 people, moderate risk
- **L (Large):** 1-3 months, small team, significant risk
- **XL (Extra Large):** 3+ months, cross-functional team, high risk

**QUESTIONS FOR HUMAN:**

1. **Gap Validation:**
   Review the gap matrix. Any gaps missing or miscategorized?

2. **Effort Estimates:**
   Do the effort sizes seem realistic based on your experience?
   Any gaps that will take significantly more or less effort?

3. **Resource Constraints:**
   - How many internal FTEs can be dedicated to implementation? [NUMBER]
   - External resources budget (consultants, vendors): [AMOUNT]
   - Are there blackout periods when implementation cannot happen? [DATES]

**WAIT FOR HUMAN INPUT.**

---

### Step 6.2: Implementation Phasing

**Assumptions:**
- Phased implementation reduces risk and allows early value delivery
- Quick wins from Stage 3 should be in Phase 1 where possible
- Dependencies determine minimum phase boundaries
- Regulatory deadlines are hard constraints

**Evidence:**
- Stage 3: Quick wins and priority order
- Stage 1: Timeline constraints and regulatory deadlines
- Gap analysis dependencies from Step 6.1

**Agent Action:** Propose phased implementation:

#### Phase Plan:

| Phase | Name | Gaps Addressed | Duration | Key Milestone | Dependencies |
|-------|------|---------------|----------|---------------|-------------|
| **Phase 0** | Preparation | Setup, procurement, environment | [X weeks] | Environment ready | None |
| **Phase 1** | Quick Wins + Core | GAP-001, GAP-003, ... | [X weeks] | Core functionality live | Phase 0 |
| **Phase 2** | Integration + Automation | GAP-002, GAP-005, ... | [X weeks] | Full integration | Phase 1 |
| **Phase 3** | Optimization + Advanced | GAP-004, GAP-006, ... | [X weeks] | Full functionality | Phase 2 |
| **Phase 4** | Stabilization + Handover | Testing, training, go-live | [X weeks] | Go-live | Phase 3 |

#### Phase Details:

**Phase 0: Preparation ([X weeks])**
- Vendor selection / procurement (if applicable)
- Environment setup (dev, test, production)
- Project team formation
- Detailed planning
- **Exit Criteria:** Environment ready, team assigned, vendor contract signed

**Phase 1: Quick Wins + Core ([X weeks])**
- Implement core functionality (MUST requirements)
- Deploy quick wins identified in Stage 3
- Initial user training
- **Exit Criteria:** Core features operational, quick wins delivered, pilot users trained

**Phase 2: Integration + Automation ([X weeks])**
- System integrations
- Process automation
- Data migration (if applicable)
- **Exit Criteria:** All integrations tested, automated processes running

**Phase 3: Optimization + Advanced ([X weeks])**
- SHOULD requirements implementation
- Advanced features
- Performance optimization
- **Exit Criteria:** All SHOULD requirements delivered, performance targets met

**Phase 4: Stabilization + Handover ([X weeks])**
- User acceptance testing (UAT)
- Full training rollout
- Go-live preparation
- Hypercare support
- **Exit Criteria:** UAT passed, all users trained, go-live approved

**QUESTIONS FOR HUMAN:**

1. **Phase Sequence:**
   Does the proposed phasing make sense for your organization?
   Would you reorder any phases?

2. **Phase 1 Scope:**
   What is the minimum viable scope for Phase 1 (first go-live)?
   Which MUST requirements are essential for the first phase?

3. **Parallel Execution:**
   Can any phases overlap (run in parallel)?
   Example: Training could start during Phase 2 for Phase 1 features.

4. **Go-Live Strategy:**
   [ ] Big bang: All users at once
   [ ] Phased rollout: Department by department
   [ ] Pilot: Start with one team, then expand
   Preference and reasoning: [EXPLAIN]

**WAIT FOR HUMAN INPUT.**

---

### Step 6.3: Resource Plan

**Agent Action:** Estimate resource needs per phase:

| Role | Phase 0 | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Total |
|------|---------|---------|---------|---------|---------|-------|
| Project Manager | [X%] | [X%] | [X%] | [X%] | [X%] | [FTE-months] |
| Business Analyst | [X%] | [X%] | [X%] | [X%] | [X%] | [FTE-months] |
| IT/Developer | [X%] | [X%] | [X%] | [X%] | [X%] | [FTE-months] |
| Vendor/Consultant | [X%] | [X%] | [X%] | [X%] | [X%] | [FTE-months] |
| Business Users (testing) | [X%] | [X%] | [X%] | [X%] | [X%] | [FTE-months] |
| Training | - | - | [X%] | [X%] | [X%] | [FTE-months] |

---

### Step 6.4: Change Management Plan

**Agent Action:** Outline organizational change management:

| Activity | Phase | Audience | Owner | Method |
|----------|-------|----------|-------|--------|
| Stakeholder communication | All | All staff | Project Sponsor | Email, town halls |
| Early adopter program | Phase 1 | Selected users | BA | Workshops, 1-on-1 |
| Training delivery | Phase 2-4 | All users | BA / Vendor | Classroom, e-learning |
| Feedback collection | Phase 1-4 | All users | BA | Surveys, drop-in sessions |
| Resistance management | All | Resistors | Project Sponsor | 1-on-1 meetings |

---

### Step 6.5: Training Plan

| Training Module | Audience | Duration | Method | Phase |
|----------------|----------|----------|--------|-------|
| [Module 1: Overview] | All users | [X hours] | Presentation | Phase 1 |
| [Module 2: Core features] | Primary users | [X hours] | Hands-on workshop | Phase 1-2 |
| [Module 3: Advanced features] | Power users | [X hours] | Hands-on workshop | Phase 3 |
| [Module 4: Admin training] | IT admins | [X hours] | Technical workshop | Phase 2 |

---

## Deliverable Template: STAGE_06_Gap_Analysis_Roadmap.md

```markdown
# STAGE 6: GAP ANALYSIS & IMPLEMENTATION ROADMAP

**Project:** [Project Name]
**Project ID:** [BABOK-YYYYMMDD-XXXX]
**Date:** [AUTO-GENERATED]
**Status:** APPROVED BY HUMAN on [DATE]

---

## EXECUTIVE SUMMARY (1 PAGE)

**Purpose of This Stage:**
Define the path from current state to target state with clear phases, resources, and milestones.

**Key Findings:**
1. [X] gaps identified between AS-IS and TO-BE
2. [Y]-phase implementation plan over [Z] months
3. Total resource requirement: [N FTE-months] internal + [M] external
4. First value delivery (Phase 1): [X weeks] from project start

**Implementation Timeline:**
| Phase | Duration | Key Deliverable |
|-------|----------|-----------------|
| Phase 0 | [X weeks] | Environment + team ready |
| Phase 1 | [X weeks] | Core features live |
| Phase 2 | [X weeks] | Full integration |
| Phase 3 | [X weeks] | All features |
| Phase 4 | [X weeks] | Go-live + stabilization |
| **TOTAL** | **[X months]** | **Full deployment** |

---

## DETAILED ANALYSIS

### 1. GAP ANALYSIS MATRIX
[Full gap matrix with all gaps]

### 2. IMPLEMENTATION PHASES
[Detailed phase descriptions with entry/exit criteria]

### 3. RESOURCE PLAN
[Resource allocation per phase]

### 4. CHANGE MANAGEMENT PLAN
[Communication, training, resistance management]

### 5. TRAINING PLAN
[Training modules, audiences, methods]

### 6. GO-LIVE CRITERIA
[Checklist for production readiness]

---

## HUMAN APPROVAL

**Next Command:** `Approve 6` to proceed to Stage 7
```

---

## Quality Checklist for Stage 6

Before presenting for approval:

- [ ] Every difference between AS-IS and TO-BE captured as a gap
- [ ] Gaps sized realistically (S/M/L/XL)
- [ ] Dependencies between gaps identified
- [ ] Implementation phases have clear boundaries and exit criteria
- [ ] Quick wins included in Phase 1
- [ ] Regulatory deadlines respected in timeline
- [ ] Resource plan covers all phases with realistic FTE estimates
- [ ] Change management plan addresses communication, training, resistance
- [ ] Go-live strategy defined and validated by human
- [ ] Total timeline fits within Stage 1 constraints

---

**Version:** 1.4
**Stage Owner:** Business Analyst
**BABOK Techniques Used:** Gap Analysis, Decision Analysis, Estimation, Planning
