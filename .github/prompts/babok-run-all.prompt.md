---
description: Run full BABOK analysis — all 8 stages automated via CLI
---

# BABOK Full Analysis — Automated Pipeline

## What this prompt does

Runs the complete 8-stage BABOK business analysis pipeline using `babok run`.

## Steps

1. **Check if context file exists**. Read `templates/project_context.example.json` to understand the required format.

2. **Ask the user for project details** (if `my_project_context.json` doesn't exist in workspace root):
   - Project name
   - Short project description / scope
   - Language (PL or EN)
   - Company name and industry

3. **Create `my_project_context.json`** in the workspace root based on user answers, following the structure from `templates/project_context.example.json`.

4. **Run the analysis** by executing in the terminal:
   ```
   babok run --context my_project_context.json --output BABOK_Analysis
   ```

5. **Report results** — tell the user which files were created and where.

## Notes

- Requires `babok` CLI to be installed (`npm link` from `cli/` directory)
- API key must be configured (run `babok llm key` once if needed)
- Output will be in `BABOK_Analysis/BABOK-YYYYMMDD-XXXX/`
- To export DOCX/PDF: `babok make all <project_id>`
