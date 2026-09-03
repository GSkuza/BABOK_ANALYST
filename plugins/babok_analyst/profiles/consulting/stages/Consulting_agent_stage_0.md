# STAGE 0: ENGAGEMENT CHARTER & MANDATE

**Profile:** consulting
**Practice Area:** Engagement Set-up & Governance
**Model Tier:** Rapid Mode
**Estimated Duration:** 20–30 minutes active work
**Prerequisite:** None — this is the FIRST step before Stage 1

**CLI Command:** `babok approve <id> 0` — marks Stage 0 as approved and advances to Stage 1
**CLI Reject:** `babok reject <id> 0 -r "reason"` — rejects Stage 0 with reason

---

## Purpose

Stage 0 is the mandate gate. It establishes the minimum facts needed to START a consulting engagement and, critically, draws the boundary that keeps the engagement out of software delivery. It produces a one-page Engagement Charter with:

1. **Sponsor & mandate** — who owns the decision the engagement must enable
2. **Scope & exclusions** — including the explicit "no IT/software delivery" statement
3. **Fee structure & budget ceiling** — the engagement fee and the client's ceiling for recommended changes (Stage 6 must respect it)
4. **Go/No-Go criteria** — conditions that must hold to proceed
5. **Glossary seed** — client vocabulary to align before diagnostics begin

If any Go/No-Go criterion fails, the engagement MUST NOT proceed. Document the blocker and escalate.

---

## Objectives

1. Capture the business trigger: why is this engagement happening NOW?
2. Identify the executive sponsor and the concrete decision they need to take
3. Agree the scope boundary and confirm IT delivery is excluded
4. Record fee model, budget ceiling for change and target completion date
5. Produce an acknowledged Charter document

---

## Process

### Step 0.1: Trigger and Engagement Type

📋 **STAGE 0 — QUESTION 1/4**

**Category:** Business Trigger

In one or two sentences — what event or situation caused this engagement to be initiated right now, and which type best describes it?

- process_optimization · digital_transformation (business layer) · c_level_advisory · org_design · other

Examples:
- "Order-to-cash takes 18 days; the board wants 10 before the next financing round."
- "Two regional units merged and nobody owns the end-to-end supply process."

**Please answer. I will proceed to question 2/4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded: [summarise trigger and type]*

---

### Step 0.2: Sponsor and Mandate

📋 **STAGE 0 — QUESTION 2/4**

**Category:** Sponsor & Mandate

Please provide:

1. **Executive Sponsor** (accountable for the outcome): [NAME, TITLE]
2. **Engagement Owner on the client side** (day-to-day decisions): [NAME, TITLE]
3. **The decision the engagement must enable** — complete: *"At the end, the sponsor will decide whether to ___."*

**Please answer. I will proceed to question 3/4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded: [summarise sponsor & mandate]*

---

### Step 0.3: Scope Boundary and Exclusions

📋 **STAGE 0 — QUESTION 3/4**

**Category:** Scope & Exclusions

Complete these sentences:

> **In scope:** This engagement covers [WHICH functions / processes / units].
> **Out of scope:** This engagement does NOT cover [WHAT].

Please confirm explicitly: **software / system delivery is out of scope** (existing systems will be described only as current-state context). If the client expects system selection or requirements, say so now — it changes the profile, not the stage.

**Please answer. I will proceed to question 4/4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded: [summarise scope; confirm no-IT exclusion]*

---

### Step 0.4: Fee, Budget Ceiling and Target Date

📋 **STAGE 0 — QUESTION 4/4**

**Category:** Fee Structure & Budget Ceiling

1. **Fee model:** fixed fee / time & materials / value-based / retainer — and the engagement fee ceiling
2. **Client budget ceiling for the recommended changes** (the number the Stage 6 business case must not exceed without steering approval)
3. **Target completion date** for the engagement (YYYY-MM-DD)
4. **Budget status:** pre-approved / pending / not yet discussed

**This is the last question for Stage 0.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *All 4 questions answered. Generating Stage 0 Engagement Charter...*

---

## Deliverable Template

**Single source of truth:** `profiles/consulting/templates/stages/STAGE_00_Engagement_Charter.md`

Load before writing the deliverable:
- MCP: `babok_get_stage_template` with `stage_n: 0` and the `project_id`
- CLI/file: read the template path above

**Critical:** Keep all H2 headings from the template unchanged so `babok score` completeness checks pass.

---

## Go / No-Go Check

Before presenting the charter for approval, verify:

- [ ] Trigger is specific and dated (not "we want to be more efficient")
- [ ] Sponsor is an individual with authority over the decision and the budget
- [ ] Mandate names a concrete decision
- [ ] "No IT/software delivery" exclusion is written into the charter
- [ ] Budget ceiling and target date are numeric / calendar values
- [ ] Glossary has 3–10 client terms

If any item is unchecked, flag it to the human before proceeding.

---

**Next Stage:** STAGE 1 — Stakeholder & Governance Mapping
