# AS-IS Process Map Template

**Process:** [Process Name]
**Stage:** 2 — Current State Analysis
**Notation:** BPMN 2.0 (recommended)

---

## Process Overview

| Attribute | Value |
|-----------|-------|
| Trigger | [Event that starts process] |
| End state | [Deliverable/output] |
| Departments | [List] |
| Systems | [List] |
| Average duration | [X] [unit] |
| Monthly volume | [NUMBER] |
| Error rate | [X]% |

---

## Process Steps

| Step | Actor | Action | System | Input | Output | Duration | Type |
|------|-------|--------|--------|-------|--------|----------|------|
| 1 | [Role] | [Action] | [System] | [Data] | [Data] | [X min] | Manual |
| 2 | [Role] | [Action] | [System] | [Data] | [Data] | [X min] | Automated |
| 3 | [Role] | Approve | Email | Request | Approval | 24 hrs | Manual |

---

## Handoffs & Pain Points

| From Step | To Step | Handoff Type | Pain Point ID | Issue |
|-----------|---------|--------------|---------------|-------|
| 2 | 3 | Email notification | PP-001 | No audit trail |

---

## BPMN Diagram Placeholder

```
[Start] → [Task: Receive PO] → [Task: Validate] → <Gateway: Valid?>
    → Yes → [Task: Approve in ERP] → [End]
    → No  → [Task: Email requester] → [End: Rejected]
```

**Diagram file:** `Process_Maps/[Process_Name]_AS-IS.png`

---

## Modeling Checklist

- [ ] BPMN 2.0 symbols used consistently
- [ ] All manual steps identified
- [ ] Systems annotated on each automated step
- [ ] Volume and duration metrics captured
