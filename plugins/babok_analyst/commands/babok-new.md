---
description: Start a new BABOK analysis project (Stage 0 charter gate)
argument-hint: [PL|ENG]
---

Start a new BABOK analysis project.

**Language**

- If the user passed `PL` or `ENG` (in `$ARGUMENTS` or the message after `/babok-new`), use it.
- Map `ENG` → `EN` for `babok_new_project` (MCP accepts `EN` or `PL` only).
- If no language was given, ask **once** before creating the project:

```
Wybierz język projektu / Choose project language:
1. Polski (PL)
2. English (ENG)

Skróty / shortcuts: /babok-new PL  ·  /babok-new ENG  ·  /babok-new-pl  ·  /babok-new-eng
```

Wait for the user's choice, then continue.

**Create project**

- Use `babok_new_project` with the chosen `language` (`PL` or `EN`) when MCP is available.
- Otherwise create the project under `projects/` and set journal `language` to `PL` or `EN`.

**Stage 0**

Begin Project Charter (Stage 0): ask about business trigger, sponsor, scope boundary, and Go/No-Go criteria — **one question at a time**, in the selected project language.
