# BABOK Agent Templates

Stage-first deliverable templates aligned with `quality_scoring_rubric.json` and the 9-stage BABOK ANALYST pipeline.

---

## Directory Structure

```
templates/
├── manifest.json                 # Stage → primary + modules mapping
├── project_context.schema.json   # JSON Schema for babok run --context
├── project_context.example.json
├── stages/                       # PRIMARY — one skeleton per stage (0–8)
├── modules/                      # RTM, DPIA, User Story, etc.
├── exports/                      # Post-project rollup (not per-stage)
└── industry/                     # Optional supplements (manufacturing, compliance)
```

---

## Stage Deliverables (Primary)

| Stage | Template | CLI deliverable file |
|-------|----------|----------------------|
| 0 | `stages/STAGE_00_Project_Charter.md` | `STAGE_00_Project_Charter.md` |
| 1 | `stages/STAGE_01_Project_Initialization.md` | `STAGE_01_Project_Initialization.md` |
| 2 | `stages/STAGE_02_Current_State_Analysis.md` | `STAGE_02_Current_State_Analysis.md` |
| 3 | `stages/STAGE_03_Problem_Domain_Analysis.md` | `STAGE_03_Problem_Domain_Analysis.md` |
| 4 | `stages/STAGE_04_Solution_Requirements.md` | `STAGE_04_Solution_Requirements.md` |
| 5 | `stages/STAGE_05_Future_State_Design.md` | `STAGE_05_Future_State_Design.md` |
| 6 | `stages/STAGE_06_Gap_Analysis_Roadmap.md` | `STAGE_06_Gap_Analysis_Roadmap.md` |
| 7 | `stages/STAGE_07_Risk_Assessment.md` | `STAGE_07_Risk_Assessment.md` |
| 8 | `stages/STAGE_08_Business_Case_ROI.md` | `STAGE_08_Business_Case_ROI.md` |

**H2 headings in each skeleton match `babok score` completeness checks.**

---

## Modules

| Module | Used in stage(s) |
|--------|------------------|
| `modules/RTM_Template.md` | 4 |
| `modules/User_Story_Template.md` | 4 |
| `modules/Change_Request_Template.md` | 4 |
| `modules/DPIA_Template.md` | 7 |
| `modules/Gap_Analysis_Table_Template.md` | 6 |
| `modules/Business_Case_Financial_Model_Template.md` | 8 |
| `modules/AS_IS_Process_Map_Template.md` | 2 |
| `modules/TO_BE_Design_Decisions_Template.md` | 5 |
| `modules/Short_Rationale_Evidence_Block.md` | 1–8 |
| `modules/Approval_Section_Template.md` | 1 |

---

## Industry Packs

Set `industry_pack` in `project_context.json` (or rely on `company.industry` / `compliance`):

| Pack | Supplements |
|------|-------------|
| `manufacturing` | OEE KPIs, shop-floor AS-IS patterns |
| `distribution` | WMS inventory KPIs |
| `compliance` | KSeF FR-020, GDPR DPIA extensions |

---

## How to Use

### CLI automated run

```bash
babok run --context my_project_context.json
```

Templates for each stage are injected from `manifest.json` via `cli/src/templates.js`.

### MCP agents

```
babok_get_stage_template(stage_n: 4, include_modules: true)
```

Call **before** `babok_save_deliverable`. Preserve template H2 headings.

### Manual copy

```bash
cp templates/stages/STAGE_04_Solution_Requirements.md projects/<id>/STAGE_04_Solution_Requirements.md
```

---

## Legacy Files (root)

| File | Status |
|------|--------|
| `BRD_Template.md` | Deprecated — use `exports/Executive_BRD_Export_Template.md` for rollup only |
| `User_Story_Template.md` | Moved to `modules/` |
| `Stakeholder_Analysis_Template.md` | Reference; content in `stages/STAGE_01_*` |
| `Risk_Register_Template.md` | Reference; content in `stages/STAGE_07_*` |

---

## Validation

```bash
node --test tests/unit/templates.test.js
```

CI runs this via `.github/workflows/lint-prompts.yml`.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2026-07-01 | Stage-first architecture, manifest, modules, industry packs, MCP tool |
| 1.0 | 2026-02-07 | Initial BRD, Stakeholder, User Story, Risk Register |
