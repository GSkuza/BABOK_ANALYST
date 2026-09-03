# KSeF E-Invoicing Supplement — Compliance (Poland)

**Industry pack:** compliance
**Stage:** 4 — Functional Requirements
**Reference:** FR-020 pattern (CHANGELOG v1.1.0)

---

## FR-020: KSeF E-Invoicing Integration (MUST)

**Requirement:** System shall issue and receive structured invoices via KSeF API per Polish Ministry of Finance specifications.

### Acceptance Criteria

| AC ID | GIVEN | WHEN | THEN |
|-------|-------|------|------|
| AC-020-01 | Valid invoice in ERP | User submits to KSeF | Invoice accepted; KSeF reference stored |
| AC-020-02 | Invalid NIP or schema error | Submission attempted | Clear error message; no duplicate sent |
| AC-020-03 | KSeF API timeout | Retry policy active | Max 3 retries with exponential backoff |
| AC-020-04 | Duplicate submission attempt | Same invoice re-sent | System blocks duplicate; shows existing reference |
| AC-020-05 | KSeF maintenance window | Submission attempted | Queue for retry; user notified |
| AC-020-06 | Operations dashboard | Admin views status | Real-time submission status per invoice |
| AC-020-07 | TEST environment | Developer configures | Separate credentials; no PROD data |
| AC-020-08 | UPO received | Archival policy active | UPO stored 10 years per regulation |
| AC-020-09 | Correction invoice | User issues correction | Linked to original; valid KSeF structure |

---

## NFR Links

| NFR ID | Requirement | Threshold |
|--------|-------------|-----------|
| NFR-KSEF-001 | Submission latency | < 30 seconds p95 |
| NFR-KSEF-002 | Availability during business hours | ≥ 99.5% |

---

## Regulatory Deadline

**Hard deadline:** [From project_context.regulatory_deadlines — typically 2026-12-31]

**RTM trace:** FR-020 → PS-[compliance problem] → Stage 1 Regulatory Requirements (KSeF)
