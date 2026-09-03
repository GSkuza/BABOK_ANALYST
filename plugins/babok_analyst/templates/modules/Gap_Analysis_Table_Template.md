# Gap Analysis Table Template

**Project:** [Project Name]
**Stage:** 6 — Gap Analysis & Implementation Roadmap

---

## Gap Matrix (AS-IS vs TO-BE)

| Gap ID | Area | AS-IS State | TO-BE State | Gap Description | Effort | FR Link | Dependencies | Owner |
|--------|------|-------------|-------------|-----------------|--------|---------|--------------|-------|
| GAP-001 | Process | Manual PO via email | Automated workflow in ERP | Implement approval workflow | M | FR-001 | — | BA |
| GAP-002 | Technology | SAP ERP 6.0 on-prem | S/4HANA private cloud | Platform migration | XL | FR-010 | GAP-001 | IT Lead |
| GAP-003 | People | No S/4HANA skills | 3 certified key users | Training & certification | M | — | GAP-002 | HR |
| GAP-004 | Data | Batch inventory sync | Real-time API integration | Build INT-002 | L | FR-002 | GAP-002 | Integration Lead |
| GAP-005 | Compliance | No KSeF integration | KSeF certified connector | Regulatory FR-020 | L | FR-020 | GAP-002 | Finance |

**Effort sizing:** S < 1 week | M 1–4 weeks | L 1–3 months | XL 3+ months

---

## Gap Summary by Area

| Area | Gap Count | Total Effort (person-months) |
|------|-----------|------------------------------|
| Process | [N] | [X] |
| Technology | [N] | [X] |
| People | [N] | [X] |
| Data | [N] | [X] |
| Compliance | [N] | [X] |

---

## Traceability Check

- [ ] Every gap links to at least one Stage 4 FR (S6-C1)
- [ ] Every Stage 5 design element has corresponding gap or marked N/A
- [ ] Dependencies form acyclic graph (no circular deps)
