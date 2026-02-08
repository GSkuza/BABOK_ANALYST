# BABOK Project Structure Template

## Recommended Project Folder Structure

Create the following folder structure on your disk or in your document management system.
Replace all `[placeholders]` with actual project-specific names.

```
BABOK_Analysis_[ProjectName]_[YYYY-MM-DD]/
│
├── 01_Project_Charter/
│   ├── STAGE_01_Project_Initialization.md
│   ├── Stakeholder_Contact_List.xlsx
│   ├── Project_Approval_Email.pdf
│   └── Kickoff_Meeting_Notes.md
│
├── 02_Current_State/
│   ├── STAGE_02_Current_State_Analysis.md
│   ├── Process_Maps/
│   │   ├── [Process_A]_AS-IS.png
│   │   ├── [Process_B]_AS-IS.png
│   │   └── [Process_C]_AS-IS.png
│   ├── Sample_Documents/
│   │   ├── Sample_[Document_Type_1].pdf
│   │   ├── Sample_[Document_Type_2].pdf
│   │   └── Sample_[Document_Type_3].pdf
│   └── Metrics_Baseline/
│       ├── Volume_Data_[Year].xlsx
│       ├── Time_Study_Results.xlsx
│       └── Cost_Baseline_Calculations.xlsx
│
├── 03_Problem_Analysis/
│   ├── STAGE_03_Problem_Domain_Analysis.md
│   ├── Ishikawa_Diagrams/
│   │   ├── Problem_[1]_[Short_Description].png
│   │   ├── Problem_[2]_[Short_Description].png
│   │   └── Problem_[3]_[Short_Description].png
│   ├── Prioritization_Workshop_Notes.md
│   └── Impact_Effort_Matrix.xlsx
│
├── 04_Requirements/
│   ├── STAGE_04_Solution_Requirements.md
│   ├── User_Stories/
│   │   ├── EPIC_01_[Feature_Area_1].md
│   │   ├── EPIC_02_[Feature_Area_2].md
│   │   ├── EPIC_03_[Feature_Area_3].md
│   │   └── EPIC_04_[Feature_Area_4].md
│   ├── Use_Cases/
│   │   ├── UC-001_[Use_Case_Name].pdf
│   │   ├── UC-002_[Use_Case_Name].pdf
│   │   └── UC-003_[Use_Case_Name].pdf
│   ├── Wireframes/ (if created)
│   │   ├── [Screen_Name_1]_Mockup.png
│   │   ├── [Screen_Name_2]_Mockup.png
│   │   └── [Screen_Name_3]_Mockup.png
│   └── Requirements_Traceability_Matrix.xlsx
│
├── 05_Solution_Design/
│   ├── STAGE_05_Future_State_Design.md
│   ├── Architecture_Diagrams/
│   │   ├── System_Architecture_TO-BE.png
│   │   ├── Integration_Architecture.png
│   │   └── Data_Flow_Diagram.png
│   ├── Process_Maps/
│   │   ├── [Process_A]_TO-BE.png
│   │   ├── [Process_B]_TO-BE.png
│   │   └── [Process_C]_TO-BE.png
│   └── Technical_Specifications/
│       ├── API_Integration_Specs.md
│       ├── Security_Requirements.md
│       └── Performance_Requirements.md
│
├── 06_Implementation_Planning/
│   ├── STAGE_06_Gap_Analysis_Roadmap.md
│   ├── Project_Roadmap_Gantt.xlsx
│   ├── Resource_Plan.xlsx
│   ├── Change_Management_Plan.md
│   └── Training_Plan.md
│
├── 07_Risk_Management/
│   ├── STAGE_07_Risk_Assessment.md
│   ├── Risk_Register.xlsx
│   ├── Mitigation_Plans/
│   │   ├── Risk_001_[Risk_Name]_Mitigation.md
│   │   ├── Risk_002_[Risk_Name]_Mitigation.md
│   │   └── Risk_003_[Risk_Name]_Mitigation.md
│   └── Contingency_Plans.md
│
├── 08_Business_Case/
│   ├── STAGE_08_Business_Case_ROI.md
│   ├── Financial_Model.xlsx
│   ├── Cost_Benefit_Analysis.xlsx
│   ├── Vendor_Quotes/ (if available)
│   │   ├── Quote_Vendor_[A]_[Solution_Type].pdf
│   │   ├── Quote_Vendor_[B]_[Solution_Type].pdf
│   │   └── Quote_Vendor_[C]_[Solution_Type].pdf
│   └── Executive_Presentation.pptx
│
├── 09_Vendor_Evaluation/ (optional)
│   ├── RFP_Document.md
│   ├── Vendor_Comparison_Matrix.xlsx
│   ├── Demo_Notes/
│   │   ├── Vendor_[A]_Demo_[YYYY-MM-DD].md
│   │   ├── Vendor_[B]_Demo_[YYYY-MM-DD].md
│   │   └── Vendor_[C]_Demo_[YYYY-MM-DD].md
│   └── Vendor_Selection_Rationale.md
│
├── 10_Governance/
│   ├── Meeting_Minutes/
│   │   ├── Steering_Committee_[YYYY-MM-DD].md
│   │   ├── Requirements_Workshop_[YYYY-MM-DD].md
│   │   └── Technical_Review_[YYYY-MM-DD].md
│   ├── Decision_Log.xlsx
│   ├── Change_Request_Log.xlsx
│   └── Issue_Log.xlsx
│
├── 11_Compliance/ (if applicable)
│   ├── Regulatory_Documentation/
│   │   ├── [Regulation_Name]_Registration.pdf
│   │   ├── API_Credentials_Secure.txt (ENCRYPTED)
│   │   └── [Regulation_Name]_Test_Results.md
│   ├── GDPR_DPIA.md (Data Protection Impact Assessment)
│   ├── Legal_Review/
│   │   ├── [Legal_Topic_1]_Opinion.pdf
│   │   └── [Legal_Topic_2]_Policy.md
│   └── Audit_Trail_Requirements.md
│
├── 12_Testing/
│   ├── Test_Plan.md
│   ├── Test_Cases/
│   │   ├── TC_001_[Test_Scenario_Name].xlsx
│   │   ├── TC_002_[Test_Scenario_Name].xlsx
│   │   └── TC_003_[Test_Scenario_Name].xlsx
│   ├── UAT_Scripts/
│   │   ├── UAT_Scenario_1_[User_Role_A].md
│   │   ├── UAT_Scenario_2_[User_Role_B].md
│   │   └── UAT_Scenario_3_[User_Role_C].md
│   └── Test_Results/
│       ├── UAT_Results_Phase1.xlsx
│       └── Bug_Log.xlsx
│
├── 13_Training_Materials/
│   ├── User_Guides/
│   │   ├── User_Guide_[Role_A].pdf
│   │   ├── User_Guide_[Role_B].pdf
│   │   └── User_Guide_[Role_C].pdf
│   ├── Admin_Guide.pdf
│   ├── Video_Tutorials/ (links or files)
│   │   ├── How_to_[Task_1].mp4
│   │   ├── How_to_[Task_2].mp4
│   │   └── How_to_[Task_3].mp4
│   └── Training_Schedule.xlsx
│
├── 14_Communication/
│   ├── Project_Newsletter_Archive/
│   ├── Stakeholder_Updates/
│   ├── FAQs.md
│   └── Announcement_Emails/
│
└── FINAL_Documentation/
    ├── FINAL_Complete_Documentation.md (all 8 stages combined)
    ├── Executive_Summary.pdf (1-2 pages for C-level)
    ├── Technical_Summary.pdf (for IT department)
    ├── Business_Summary.pdf (for Finance department)
    └── Lessons_Learned.md (after project completion)
```

---

## Structure Maintenance Checklist

### During the Project:

- [ ] **Every document** has a clear name with date or version
- [ ] **Every decision** is documented in Decision_Log.xlsx
- [ ] **Every meeting** has notes saved in Meeting_Minutes/
- [ ] **Every change** requires an entry in Change_Request_Log.xlsx
- [ ] **All sensitive data** (passwords, API keys) are encrypted

### Document Versioning:

File naming format:
```
[DocumentName]_v[MajorVersion].[MinorVersion]_[YYYY-MM-DD]_[Status].md

Example:
STAGE_04_Solution_Requirements_v1.0_2025-02-15_DRAFT.md
STAGE_04_Solution_Requirements_v1.1_2025-02-18_REVIEWED.md
STAGE_04_Solution_Requirements_v2.0_2025-02-20_APPROVED.md
```

**Status codes:**
- `DRAFT` - work in progress
- `REVIEWED` - reviewed by stakeholders
- `APPROVED` - formally approved
- `FINAL` - final version

### Backup:

- [ ] **Daily:** Automatic backup to cloud (OneDrive, Google Drive, Dropbox)
- [ ] **Weekly:** Manual backup to external drive
- [ ] **After each stage:** ZIP archive of entire project with name `BABOK_Backup_Stage[N]_[YYYY-MM-DD].zip`

---

## Folder Security

### Access Levels:

| Folder | Access | Justification |
|--------|--------|--------------|
| `/01_Project_Charter/` | Project Sponsor, BA, PM | Project charter document |
| `/02_Current_State/` | BA, Process Owners, IT | Operational data (may contain sensitive info) |
| `/04_Requirements/` | BA, Dev Team, Domain Experts | Technical specifications |
| `/08_Business_Case/` | CFO, Project Sponsor, BA | Financial data - restricted |
| `/11_Compliance/` | Legal, Compliance Officer, BA | Legal documents - restricted |
| `/12_Testing/` | QA Team, Dev Team, BA | Test results |

**Rule:** If folder contains financial, legal or sensitive personal data → **Restricted Access**

---

## Progress Monitoring

Create a `Project_Dashboard.xlsx` file in the main folder with tabs:

### Tab 1: Stage Progress
| Stage | Status | Start Date | End Date | Owner | % Complete | Issues |
|-------|--------|-----------|----------|-------|------------|--------|
| Stage 1 | Completed | [Date] | [Date] | [BA Name] | 100% | None |
| Stage 2 | In Progress | [Date] | [Date] | [BA Name] | [X]% | [Description] |
| Stage 3 | Not Started | - | - | [BA Name] | 0% | - |
| ... | ... | ... | ... | ... | ... | ... |

### Tab 2: Deliverable Tracker
| Deliverable | Due Date | Status | Owner | Location |
|-------------|----------|--------|-------|----------|
| Stakeholder Register | [Date] | Done | BA | /01_Project_Charter/ |
| Process Maps (AS-IS) | [Date] | In Progress | BA | /02_Current_State/Process_Maps/ |
| Requirements Doc | [Date] | Pending | BA | /04_Requirements/ |

### Tab 3: Risk Dashboard
| Risk ID | Description | Probability | Impact | Status | Mitigation Owner |
|---------|-------------|------------|--------|--------|-----------------|
| R-001 | [Risk description] | [Low/Med/High] | [Low/Med/High] | Monitoring | [Owner] |
| R-002 | [Risk description] | [Low/Med/High] | [Low/Med/High] | Accepted | [Owner] |

---

## Quick Actions

### Starting a New Stage:

```bash
# Create folders for stage (if not exists)
mkdir -p "05_Solution_Design/Architecture_Diagrams"
mkdir -p "05_Solution_Design/Process_Maps"
mkdir -p "05_Solution_Design/Technical_Specifications"

# Copy stage deliverable from BABOK Agent output
cp "STAGE_05_Future_State_Design.md" "05_Solution_Design/"

# Open in editor
code "05_Solution_Design/STAGE_05_Future_State_Design.md"
```

### Archiving After Stage Completion:

```bash
# Create ZIP of entire stage
zip -r "STAGE_04_ARCHIVE_[YYYY-MM-DD].zip" "04_Requirements/"

# Move to backups
mv "STAGE_04_ARCHIVE_[YYYY-MM-DD].zip" "Backups/"
```

### Generating Executive Summary:

After completing all stages, use BABOK Agent to generate:

```
Generate Executive Summary from all 8 stages:
- Maximum 2 pages
- Focus on: Business value, ROI, timeline, risks
- Audience: CEO, CFO, Board
- Format: PDF-ready markdown
```

---

## Email Templates for Stakeholders

### Template 1: Stage Approval Request

```
Subject: [Project Name] - Stage [N] Approval Needed

Hi [Stakeholder Name],

We have completed Stage [N]: [Stage Name] of the business analysis
for [Project Name].

Attached Documents:
- STAGE_0[N]_[Name].md
- [Supporting doc 1]
- [Supporting doc 2]

Key Findings:
1. [Finding 1]
2. [Finding 2]
3. [Finding 3]

Next Steps:
- Please review by: [Date]
- Approval meeting: [Date, Time, Location]
- If approved, we proceed to Stage [N+1]: [Next Stage Name]

Questions? Contact [BA Name] at [email] or [phone].

Best regards,
[Your Name]
```

### Template 2: Data Request

```
Subject: [Project Name] - Data Needed for [Stage Name]

Hi [Department Head],

As part of Stage [N] ([Stage Name]), we need the following data
from your department:

Requested Data:
1. [Data item 1] - Format: [Excel/PDF/other]
2. [Data item 2] - Format: [...]
3. [Data item 3] - Format: [...]

Deadline: [Date]

Why we need this:
This data helps us [specific purpose, e.g., calculate baseline metrics,
identify improvement opportunities, validate requirements].

Template attached: [If applicable]

Thank you!
[BA Name]
```

---

## Success Criteria for Folder Structure

After project completion, your folder structure should:

- All **8 stages** in separate folders with approved deliverables
- **Backup archives** for each critical stage
- **Approved documents** (status APPROVED or FINAL)
- **Complete audit trail** (Decision Log, Change Log, Meeting Minutes)
- **Searchable** content (clear file names, consistent structure)
- **Transferable** (can be passed to another BA or team)
- **Compliance-ready** (GDPR, ISO 27001, or other applicable standards)

---

## Recommended Tools

| Task | Tool | Notes |
|------|------|-------|
| Process Mapping | draw.io / Lucidchart | BPMN diagrams |
| Project Management | Jira / Monday.com / Azure DevOps | Stage tracking |
| Document Collaboration | Google Docs / Confluence | Real-time editing |
| Requirements Management | Jama / Azure DevOps | RTM, traceability |
| Wireframing | Figma / Balsamiq | UI mockups |
| Spreadsheets | Excel / Google Sheets | Calculations, matrices |
| Mind Mapping | MindMeister / XMind | Brainstorming |

### Integrations:

If using **Jira + Confluence**:
- Link each Stage document to Jira Epic
- Embed diagrams from draw.io directly in Confluence
- Automatic RTM updates from Jira requirements

If using **Azure DevOps**:
- Store Stage docs in Wiki
- Link User Stories to Requirements (automatic traceability)
- Track test cases directly from Stage 4 requirements

---

## Final Checklist

Before archiving the project:

- [ ] All 8 stages completed and approved
- [ ] FINAL_Complete_Documentation.md generated and reviewed
- [ ] Executive Summary ready for leadership
- [ ] All attachments and diagrams in appropriate folders
- [ ] Sensitive data encrypted or removed
- [ ] Backup archive created and tested (unpacking works)
- [ ] Documentation handed over to IT/Project Manager
- [ ] Lessons Learned document completed
- [ ] Stakeholder feedback collected
- [ ] Project formally closed (email to sponsor)

---

**Version:** 1.4
**Last Updated:** 2026-02-08
**Maintained by:** BABOK Agent Development Team
