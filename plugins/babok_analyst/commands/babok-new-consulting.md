---
description: Start a new management-consulting engagement (profile "consulting", Stage 0 charter gate — no IT delivery)
argument-hint: [PL|ENG]
---

Start a new **consulting engagement** using the `consulting` pipeline profile (stages 0–6: charter → stakeholders & governance → diagnostic & root cause → strategic options → target operating model & roadmap → risk & change readiness → business case & value realization). This profile never produces software requirements, system designs or vendor selections.

**Language**

- If the user passed `PL` or `ENG` (in `$ARGUMENTS` or the message after `/babok-new-consulting`), use it.
- Map `ENG` → `EN` for `babok_new_project` (MCP accepts `EN` or `PL` only).
- If no language was given, ask **once** before creating the project:

```
Wybierz język projektu / Choose engagement language:
1. Polski (PL)
2. English (ENG)
```

Wait for the user's choice, then continue.

**Create project**

- Use `babok_new_project` with `profile: "consulting"` and the chosen `language` when MCP is available.
- Otherwise run `babok new --profile consulting -l <PL|EN>` from the CLI.
- The project ID will start with `BC-`.

**Stage 0**

Call `babok_get_stage` with `stage_n: 0` for the new project and follow the Consulting Agent instructions: business trigger & engagement type, sponsor & mandate, scope & explicit "no IT/software delivery" exclusion, fee structure & budget ceiling — **one question at a time**, in the selected language. Fetch the deliverable skeleton with `babok_get_stage_template` (pass the `project_id`) before writing, keep every H2 heading unchanged, then `babok_save_deliverable` and `babok_submit_for_review`.
