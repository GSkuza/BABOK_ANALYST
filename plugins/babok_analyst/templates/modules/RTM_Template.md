# Requirements Traceability Matrix (RTM) Template

**Project:** [Project Name]
**Stage:** 4 — Solution Requirements
**Version:** 1.0

---

## RTM — Full Matrix

| Req ID | Requirement | Problem ID (Stage 3) | Stakeholder | MoSCoW | User Story | Design Element (Stage 5) | Risk ID (Stage 7) | Test Case |
|--------|-------------|----------------------|-------------|--------|------------|---------------------------|-------------------|-----------|
| FR-001 | [Functional requirement text] | PS-001 | Finance Manager | MUST | US-001 | DD-001 | R-002 | TC-001 |
| FR-002 | [Functional requirement text] | PS-002 | Procurement Mgr | MUST | US-002 | DD-002 | R-001 | TC-002 |
| NFR-001 | Response time < 2s p95 | — | IT Lead | MUST | — | INT-001 | R-003 | TC-NFR-001 |

---

## Coverage Rules

- Every **FR-NNN** must link to at least one **Problem ID** from Stage 3
- Every **MUST** requirement must have a **Design Element** before Stage 6
- No requirement without a traceable source (scope creep check S4-C3)

---

## Coverage Summary

| Metric | Count |
|--------|-------|
| Total FRs | [N] |
| FRs traced to Stage 3 | [N] |
| Untraced FRs | 0 (target) |
| MUST FRs with user story | [N]/[N] |
