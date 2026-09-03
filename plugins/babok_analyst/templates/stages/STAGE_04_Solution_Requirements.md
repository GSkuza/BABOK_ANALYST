# STAGE 4: SOLUTION REQUIREMENTS DEFINITION

**Project:** [Project Name]
**Project ID:** [BABOK-YYYYMMDD-XXXX]
**Date:** [YYYY-MM-DD]
**Status:** PENDING APPROVAL

---

## Executive Summary

**Purpose:** Define functional and non-functional requirements with traceability to Stage 3 problems.

**MoSCoW summary:**

| Priority | Count | Notes |
|----------|-------|-------|
| MUST | [N] | Essential for go-live |
| SHOULD | [N] | Phase 1+ |
| COULD | [N] | Backlog |
| WON'T | [N] | Out of scope |

---

## Functional Requirements (FR-NNN)

| ID | Requirement | Priority | Source (Problem) | Acceptance Summary |
|----|-------------|----------|------------------|-------------------|
| FR-001 | [System shall...] | MUST | PS-001 | [Testable outcome] |
| FR-002 | [System shall...] | SHOULD | PS-002 | [Testable outcome] |

---

## Non-Functional Requirements (NFR-NNN)

| ID | Category | Requirement | Threshold | Measurement |
|----|----------|-------------|-----------|-------------|
| NFR-001 | Performance | API response time | < 2 seconds (p95) | Load test |
| NFR-002 | Availability | System uptime | ≥ 99.5% monthly | Monitoring |
| NFR-003 | Security | Authentication | MFA for admin roles | Security audit |

---

## User Stories with Acceptance Criteria

### US-001 (FR-001)

**As a** [role], **I want** [capability], **so that** [benefit].

**Acceptance criteria (GIVEN-WHEN-THEN):**
1. GIVEN [context] WHEN [action] THEN [observable outcome]
2. GIVEN [context] WHEN [action] THEN [observable outcome]

---

## Requirements Traceability Matrix (RTM)

| Req ID | Requirement | Problem (Stage 3) | Stakeholder | Priority | User Story | Stage 5 Design | Stage 7 Risk |
|--------|-------------|-------------------|-------------|----------|------------|----------------|--------------|
| FR-001 | [Text] | PS-001 | [Name] | MUST | US-001 | TBD | TBD |
| NFR-001 | [Text] | Stage 2 baseline | IT Lead | MUST | — | TBD | TBD |

---

## Change Control Process

1. Submit Change Request (CR-XXX)
2. Impact analysis (scope, time, cost, requirements)
3. Steering Committee review
4. Approve / Reject / Defer
5. Update RTM and affected deliverables

| CR ID | Description | Requested By | Impact | Decision | Date |
|-------|-------------|--------------|--------|----------|------|
| — | (empty at baseline) | — | — | — | — |

---

## Regulatory Compliance Requirements

| Regulation | FR/NFR ID | Requirement | Priority | Deadline |
|------------|-----------|-------------|----------|----------|
| GDPR | FR-010 | [Requirement] | MUST | [YYYY-MM-DD] |
| KSeF | FR-020 | [Requirement] | MUST | [YYYY-MM-DD] |

---

## Quality Checklist

- [ ] Every FR has unique ID FR-NNN (S4-Q3)
- [ ] MoSCoW applied to all requirements (S4-Q4)
- [ ] NFRs have numeric thresholds (S4-Q2)
- [ ] Acceptance criteria are testable (S4-Q1)
- [ ] Every FR traces to Stage 3 problem in RTM (S4-C1)
- [ ] Regulatory requirements present when Stage 1 identified them (S4-C2)

---

## Approval Section

| Field | Value |
|-------|-------|
| Approver | [Name, Title] |
| Date | [YYYY-MM-DD] |
| Comments | [Optional] |

**Change log**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | [YYYY-MM-DD] | [Author] | Requirements baseline |
