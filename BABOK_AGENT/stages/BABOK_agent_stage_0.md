# STAGE 0: PROJECT CHARTER

**BABOK Knowledge Area:** Business Analysis Planning and Monitoring
**Model Tier:** Rapid Mode
**Estimated Duration:** 15–30 minutes active work
**Prerequisite:** None — this is the FIRST step before Stage 1

**CLI Command:** `babok approve <id> 0` — marks Stage 0 as approved and advances to Stage 1
**CLI Reject:** `babok reject <id> 0 -r "reason"` — rejects Stage 0 with reason

---

## Purpose

Stage 0 is a lightweight gate that establishes the minimum viable facts needed to START a BABOK analysis. It produces a one-page Project Charter with:

1. **Scope statement** — what we are analyzing and what is explicitly excluded
2. **Sponsor sign-off fields** — who owns the decision and the budget
3. **Go / No-Go criteria** — 3 conditions that must be true to proceed to Stage 1
4. **Glossary seed** — 5–10 key terms to align vocabulary before elicitation begins

If any Go / No-Go criterion fails, the analysis MUST NOT proceed. Document the blocker and escalate.

---

## Objectives

1. Capture the business trigger: why is this analysis happening NOW?
2. Identify the single accountable decision-maker (budget owner / sponsor)
3. Agree on a one-sentence scope boundary
4. Surface any immediate blockers (budget freeze, org change, competing initiatives)
5. Produce a signed / acknowledged Charter document

---

## Process

### Step 0.1: Trigger Identification

Ask the human ONE question:

---

📋 **STAGE 0 — QUESTION 1/3**

**Category:** Business Trigger

In one or two sentences — what event or situation caused this analysis to be initiated right now?

Examples:
- "Auditors flagged our manual invoice process as a compliance risk."
- "We are launching a new product line and the current ERP cannot support it."
- "The CEO wants to reduce operational costs by 15% before year-end."

**Please answer. I will proceed to question 2/3.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded: [summarize trigger]*

---

### Step 0.2: Sponsor and Budget Confirmation

📋 **STAGE 0 — QUESTION 2/3**

**Category:** Sponsor & Budget

Please provide:

1. **Project Sponsor** (the person accountable for outcomes): [NAME, TITLE]
2. **Budget owner** (person who controls funding): [NAME, TITLE — may be same as sponsor]
3. **Is budget pre-approved?**
   - [ ] Yes — confirmed budget exists
   - [ ] Pending — subject to business case approval (Stage 8)
   - [ ] Not yet discussed

**Please answer. I will proceed to question 3/3.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded: [summarize sponsor & budget]*

---

### Step 0.3: Scope Boundary

📋 **STAGE 0 — QUESTION 3/3**

**Category:** Scope Statement

Complete these two sentences:

> **In scope:** This analysis covers [WHAT].
> **Out of scope:** This analysis does NOT cover [WHAT].

If you are unsure about exclusions, list anything you are certain should NOT be touched (systems, departments, processes, geographies).

**This is the last question for Stage 0.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *All 3 questions answered. Generating Stage 0 Charter...*

---

## Deliverable Template: STAGE_00_Project_Charter.md

```markdown
# PROJECT CHARTER

**Project ID:** [AUTO]
**Date:** [AUTO]
**Status:** DRAFT — Pending Sponsor Acknowledgement

---

## 1. Business Trigger

[Human answer to Question 1]

---

## 2. Scope Statement

**In scope:** [Human answer — in-scope part]

**Out of scope:** [Human answer — out-of-scope part]

---

## 3. Sponsor & Budget

| Role | Name | Title |
|------|------|-------|
| Project Sponsor | [Name] | [Title] |
| Budget Owner | [Name] | [Title] |

**Budget status:** [Pre-approved / Pending business case / Not yet discussed]

---

## 4. Go / No-Go Criteria

All three must be true to proceed to Stage 1:

| # | Criterion | Status |
|---|-----------|--------|
| 1 | A named sponsor with budget authority has acknowledged this charter | ⏳ Pending |
| 2 | The scope boundary is agreed and documented above | ⏳ Pending |
| 3 | No active organizational freeze or competing initiative blocks this project | ⏳ Pending |

---

## 5. Glossary Seed

Define 5–10 key terms used in the scope statement to prevent miscommunication:

| Term | Definition |
|------|------------|
| [Term 1] | [Plain-language definition] |
| [Term 2] | [Plain-language definition] |
| ... | ... |

---

## 6. Sponsor Acknowledgement

By approving this charter (via `babok approve <id> 0`), the sponsor confirms:
- The scope statement is accurate
- They have budget authority or are named as the business case approver
- The analysis may proceed to Stage 1

**Sponsor:** _________________ **Date:** _________________

---

**Next command:** `babok approve <id> 0` → proceed to Stage 1
```

---

## Go / No-Go Check

Before presenting the charter for approval, verify:

- [ ] Trigger is specific (not "we want to improve things")
- [ ] Sponsor name is a real individual, not a committee or department
- [ ] Scope has at least one explicit exclusion (proves the boundary was actually thought about)
- [ ] No red-flag blockers surfaced during the questions

If any item is unchecked, flag it to the human before proceeding.

---

**Next Stage:** STAGE 1 — Project Initialization & Stakeholder Mapping
