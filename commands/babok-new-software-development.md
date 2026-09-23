---
description: Start a new software-development initiative on an existing product (profile "software-development", autonomous repository baseline)
argument-hint: [PL|ENG]
---

Start a new **software-development initiative** using the `software-development` pipeline profile (stages 0–6: change charter → product & repository baseline → change impact & gap analysis → options & architecture decisions → implementation & verification plan → release & operational readiness → outcome & context reconciliation). This profile plans modernisation and new-feature work against an **existing** product and its connected repositories — it does not replace human authorisation to execute code, merge, or deploy.

**Language**

- If the user passed `PL` or `ENG` (in `$ARGUMENTS` or the message after `/babok-new-software-development`), use it.
- Map `ENG` → `EN` for `babok_new_project` (MCP accepts `EN` or `PL` only).
- If no language was given, ask **once** before creating the project:

```
Wybierz język projektu / Choose engagement language:
1. Polski (PL)
2. English (ENG)
```

Wait for the user's choice, then continue.

**Create project**

- Use `babok_new_project` with `profile: "software-development"` and the chosen `language` when MCP is available.
- Otherwise run `babok new --profile software-development -l <PL|EN>` from the CLI.
- The project ID will start with `SD-`.

**Stage 0**

Call `babok_get_stage` with `stage_n: 0` for the new project and follow the Software Development Agent instructions: business trigger & desired outcome, product & repository scope (host, owner/namespace, ref for every repository), ownership & authorisation boundaries, budget ceiling, target release window & exclusions — **one question at a time**, in the selected language. Fetch the deliverable skeleton with `babok_get_stage_template` (pass the `project_id`) before writing, keep every H2 heading unchanged, then `babok_save_deliverable` and `babok_submit_for_review`.

**After Stage 0 is approved**

Stages 1 and 3 are performed autonomously from the connected repositories — do not ask the human technology or architecture questions there; gather and cite evidence instead, and only escalate a genuinely business-owned, decision-critical gap. This profile never self-approves a generated stage, including when run through `babok run --orchestrate`: every stage still requires a human `babok approve <id> <stage>`.
