# STAGE 3: OPTIONS & ARCHITECTURE DECISIONS

**Profile:** software-development
**Practice Area:** Autonomous Option Design
**Model Tier:** Deep Analysis Mode
**Estimated Duration:** Autonomous — no scheduled human wait, subject to run limits
**Prerequisite:** Stage 2 Change Impact & Gap Analysis approved

**CLI Command:** `babok approve <id> 3` — marks Stage 3 as approved and advances to Stage 4
**CLI Reject:** `babok reject <id> 3 -r "reason"` — rejects Stage 3 with reason

---

## Purpose

Stage 3 designs the solution options for the change identified in Stage 2, evaluates them against the Stage 1 baseline and Stage 0/2 constraints, and recommends one — with draft Architecture Decision Records (`ADR-NN`) and a compatibility/migration approach. Like Stage 1, this stage works from evidence and prior stage approvals; it does not re-open the technical interview.

---

## Objectives

1. Identify existing mechanisms in the Stage 1 baseline that could be extended before proposing new ones
2. Generate a small number of genuinely distinct options, including an explicit do-nothing/defer baseline
3. Evaluate each option's impact on code, data, contracts, security, operability and maintenance cost
4. Recommend one option with a stated rationale and produce draft ADRs for its key decisions
5. Define the compatibility, migration and verification approach the recommendation requires
6. Subject the recommendation to a self-critique pass before presenting it, correcting any finding the critique invalidates

---

## Process (Autonomous Design Loop)

1. **Reuse check** — search the Stage 1 baseline for existing components, libraries or patterns already in the codebase that address part of the Stage 2 gap; note any that reduce the design space.
2. **Option generation** — produce 2–4 substantively different options plus a do-nothing/defer baseline. Each option must reference the Stage 2 affected components/contracts it touches.
3. **Evaluation** — compare options on impact, risk, effort, reversibility and operability, using the Stage 0 risk appetite and constraints as the weighting basis. State assumptions explicitly.
4. **Recommendation** — select one option, state why it beats the runner-up, and draft its ADRs (`ADR-NN`): context, decision, consequences, alternatives considered.
5. **Compatibility & migration** — define what breaks, what must stay backward-compatible, and how data/contract migration (if any) will be verified before rollout.
6. **Critique pass** — re-examine the recommendation against the Stage 1 evidence and Stage 2 constraints looking specifically for a contradiction or an unverified claim; correct the deliverable if the critique finds one, and note what was corrected.

Ask the human only if a genuinely business-owned trade-off cannot be resolved from Stage 0–2 (e.g. a choice between a cheaper option with more user disruption and a costlier option with none). If asked, ask exactly one specific question, wait for the answer, and continue.

---

## Deliverable Template

**Single source of truth:** `profiles/software-development/templates/stages/STAGE_03_Options_Architecture_Decisions.md`

Load before writing the deliverable:
- MCP: `babok_get_stage_template` with `stage_n: 3` and the `project_id`
- CLI/file: read the template path above

**Critical:** Keep all H2 headings from the template unchanged so `babok score` completeness checks pass.

---

## Go / No-Go Check

Before presenting the options for approval, verify:

- [ ] At least one option reuses or extends an existing Stage 1 mechanism, or explains why none applies
- [ ] A do-nothing/defer baseline is evaluated alongside the proposed options
- [ ] The recommendation names one option and states its evaluation score against the runner-up
- [ ] Draft ADRs exist for the recommendation's key decisions
- [ ] The critique pass is documented, including anything it corrected

If any item is unchecked, flag it to the human before proceeding.

---

**Next Stage:** STAGE 4 — Implementation & Verification Plan
