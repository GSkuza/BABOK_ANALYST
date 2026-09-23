# STAGE 0: CHANGE CHARTER

**Profile:** software-development
**Practice Area:** Change Initiation & Mandate
**Model Tier:** Rapid Mode
**Estimated Duration:** 15–25 minutes active work
**Prerequisite:** None — this is the FIRST step before Stage 1

**CLI Command:** `babok approve <id> 0` — marks Stage 0 as approved and advances to Stage 1
**CLI Reject:** `babok reject <id> 0 -r "reason"` — rejects Stage 0 with reason

---

## Purpose

Stage 0 is the mandate gate for a software-development initiative against an **existing** product. It captures the minimum business decisions needed before the agent is authorised to connect to repositories and build a baseline: what problem or opportunity this change addresses, which product and repositories are in scope, the budget/timeline ceilings, and the boundary the initiative must not cross (e.g. no infrastructure migration, no new external vendor).

This stage does **not** ask about technology, architecture or code — those are established autonomously in Stage 1 from the repositories once they are connected.

---

## Objectives

1. Capture the business trigger and desired outcome for this change
2. Identify the product and the repository/repositories in scope (host, owner/namespace, name, primary ref)
3. Confirm ownership: who authorises the recommendation, and who may authorise code execution/publication later
4. Record budget ceiling, target release window and explicit exclusions
5. Produce an acknowledged Change Charter

---

## Process

### Step 0.1: Business Trigger and Desired Outcome

📋 **STAGE 0 — QUESTION 1/4**

**Category:** Business Trigger

In one or two sentences: what problem, opportunity or request is driving this change, and what measurable outcome would make it a success?

Examples:
- "Checkout abandonment is 22% above target; we want a saved-payment-method flow to cut it to industry baseline."
- "The invoicing service still hand-rolls PDF generation; we want to modernise it before the next compliance audit."

**Please answer. I will proceed to question 2/4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded: [summarise trigger and desired outcome]*

---

### Step 0.2: Product and Repositories in Scope

📋 **STAGE 0 — QUESTION 2/4**

**Category:** Product & Repository Scope

Please provide, for every repository this change may touch:

1. **Product name** (the trwały product this initiative belongs to — reused across future initiatives)
2. **Host** (github / gitlab / other) and **owner/namespace + repository name**
3. **Primary ref** to analyse (branch, tag or commit) — if omitted, the current default branch is used and recorded explicitly
4. **Role** of each repository in the product (e.g. frontend, backend, infrastructure)

If this product has a baseline from a previous initiative, name it — Stage 1 will reuse and refresh it instead of rebuilding from zero.

**Please answer. I will proceed to question 3/4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded: [summarise product/repositories in scope]*

---

### Step 0.3: Ownership and Authorisation Boundaries

📋 **STAGE 0 — QUESTION 3/4**

**Category:** Ownership & Authorisation

1. **Decision owner** — who approves the plan produced by this initiative (Stage 4)?
2. **Execution authoriser** — who may separately authorise running the analysed repository's own code/tests and publishing a pull/merge request (Stage 4→5)? This may be the same person, but the authorisation is always a distinct, later decision — approving this charter does not grant it.
3. **Excluded actions** — confirm this initiative will not, on its own, merge changes or deploy to production; those remain human-triggered actions on the hosting platform.

**Please answer. I will proceed to question 4/4.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *Answer recorded: [summarise ownership and authorisation boundaries]*

---

### Step 0.4: Budget, Timeline and Exclusions

📋 **STAGE 0 — QUESTION 4/4**

**Category:** Budget & Timeline Ceiling

1. **Budget ceiling** for this change (implementation effort/cost, e.g. person-days or currency)
2. **Target release window** (YYYY-MM-DD or a named milestone)
3. **Explicit exclusions** — what this initiative must NOT attempt (e.g. no database migration, no new third-party vendor, no public API breaking change)
4. **Risk appetite** — low / medium / high, and any regulatory or compliance constraint that applies

**This is the last question for Stage 0.**

---

[WAIT FOR HUMAN RESPONSE]

✅ *All 4 questions answered. Generating Stage 0 Change Charter...*

---

## Deliverable Template

**Single source of truth:** `profiles/software-development/templates/stages/STAGE_00_Change_Charter.md`

Load before writing the deliverable:
- MCP: `babok_get_stage_template` with `stage_n: 0` and the `project_id`
- CLI/file: read the template path above

**Critical:** Keep all H2 headings from the template unchanged so `babok score` completeness checks pass.

---

## Go / No-Go Check

Before presenting the charter for approval, verify:

- [ ] Trigger and desired outcome are specific and measurable
- [ ] Every repository in scope has a host, namespace/owner, name and ref
- [ ] Decision owner and execution authoriser are named individuals, even if the same person
- [ ] It is explicit that approving this charter does not authorise code execution or publication
- [ ] Budget ceiling, target release window and at least one exclusion are recorded

If any item is unchecked, flag it to the human before proceeding.

---

**Next Stage:** STAGE 1 — Product & Repository Baseline (autonomous)
