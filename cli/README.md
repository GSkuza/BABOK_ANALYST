# BABOK CLI - Quick Start Guide

Cross-platform command-line tool for managing BABOK Agent project lifecycle. Create projects, track stage progress, save/load state, and export deliverables — all from the terminal.

---

## Table of Contents

- [Installation](#installation)
- [Language Support](#language-support)
- [How It Works](#how-it-works)
- [Complete Workflow](#complete-workflow)
- [Command Reference](#command-reference)
  - [babok new](#babok-new)
  - [babok lang](#babok-lang)
  - [babok pl / babok eng](#babok-pl--babok-eng)
  - [babok list](#babok-list)
  - [babok status](#babok-status)
  - [babok approve](#babok-approve)
  - [babok reject](#babok-reject)
  - [babok save](#babok-save)
  - [babok load](#babok-load)
  - [babok export](#babok-export)
  - [babok make docx](#babok-make-docx)
  - [babok make pdf](#babok-make-pdf)
  - [babok make all](#babok-make-all)
- [Project Journal](#project-journal)
- [Directory Structure](#directory-structure)
- [Tips and Tricks](#tips-and-tricks)
- [Troubleshooting](#troubleshooting)

---

## Language Support

BABOK CLI supports **English (EN)** and **Polish (PL)** languages.

### Setting Language

```bash
# Set language to English
babok lang EN
babok eng        # shortcut

# Set language to Polish  
babok lang PL
babok pl         # shortcut

# Check current language
babok lang
```

### Language Behavior

- **BEGIN NEW PROJECT** → Creates project in **English** (default if `babok lang EN` was set first)
- **ZACZNIJ NOWY PROJEKT** → Creates project in **Polish** (default if `babok lang PL` was set first)

**Priority Logic:**
1. If `babok pl` set first, then `BEGIN NEW PROJECT` → Polish project
2. If `babok eng` set first, then `ZACZNIJ NOWY PROJEKT` → English project
3. Default (no language set) → English

**Per-Project Language:**
```bash
# Create English project explicitly
babok new --name "My Project" --language EN

# Create Polish project explicitly
babok new --name "Mój Projekt" --language PL
```

Once set, the project language is stored in the journal and **the AI agent will respond in that language** throughout all stages.

---

## Installation

### Prerequisites

- **Node.js 18+** — [Download](https://nodejs.org/)
- **Git** — [Download](https://git-scm.com/downloads)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/GSkuza/BABOK_ANALYST.git
cd BABOK_ANALYST/cli

# 2. Install dependencies
npm install

# 3. Link the CLI globally (makes 'babok' available everywhere)
npm link
```

### Verify Installation

```bash
babok --version
# Output: 1.3.0

babok --help
# Shows all available commands
```

### Uninstall

```bash
cd BABOK_ANALYST/cli
npm unlink
```

---

## How It Works

The BABOK CLI manages **project state locally** while the actual business analysis work happens in your preferred AI chat interface (Claude.ai, ChatGPT, Claude Code, etc.).

```
                    BABOK CLI                          AI Chat Interface
              (state management)                    (analysis work)

    babok new ──────────────────> Project created
                                  with unique ID
                                        │
                                        ▼
                                  Open AI chat,
                                  type: BEGIN NEW PROJECT
                                        │
                                        ▼
                                  Work through Stage 1
                                  with AI agent
                                        │
                                        ▼
    babok approve <id> 1 <────── Stage 1 complete
                                        │
                                        ▼
                                  Continue Stage 2...
                                        │
    babok save <id> <────────── Need to pause?
                                        │
         ── next session ──             │
                                        ▼
    babok load <id> ─────────> Copy context block
                                  into AI chat
                                        │
                                        ▼
                                  Resume work
                                        │
    babok export <id> <──────── All 8 stages done
```

**Key principle:** The CLI tracks *what stage you're on* and *what decisions were made*. The AI agent does the analytical work.

---

## Complete Workflow

### Step 1: Create a New Project

```bash
babok new --name "Document Management System for Acme Corp"
```

Output:
```
 NEW PROJECT CREATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project ID:      BABOK-20260208-K7M3
  Project Name:    Document Management System for Acme Corp
  Created:         2026-02-08T10:30:00.000Z
  Directory:       ./projects/BABOK-20260208-K7M3/
  Journal:         PROJECT_JOURNAL_BABOK-20260208-K7M3.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Save this Project ID to resume later: BABOK-20260208-K7M3
```

**Write down the Project ID** — you'll use it for all subsequent commands.

If you omit `--name`, the CLI will prompt you interactively:

```bash
babok new
# Project name: _
```

### Step 2: Start Analysis in AI Chat

Open your preferred AI chat interface (Claude.ai, ChatGPT, etc.) with the BABOK Agent system prompt loaded. Type:

```
BEGIN NEW PROJECT
```

The AI agent will ask questions about your project. Answer them and work through Stage 1.

### Step 3: Track Progress

After the AI agent completes Stage 1, mark it as approved in the CLI:

```bash
babok approve K7M3 1
```

Output:
```
 Stage 1 APPROVED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project:         BABOK-20260208-K7M3
  Stage:           1 - Project Initialization & Stakeholder Mapping
  Approved at:     2026-02-08 12:15:00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next: Stage 2 - Current State Analysis (AS-IS)
```

The journal automatically advances Stage 2 to "in_progress".

### Step 4: Check Status Anytime

```bash
babok status K7M3
```

Output:
```
Project Status: BABOK-20260208-K7M3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project ID:      BABOK-20260208-K7M3
  Project Name:    Document Management System for Acme Corp
  Created:         2026-02-08 10:30:00
  Last Updated:    2026-02-08 12:15:00

  Stages:
  Stage 1:  APPROVED (2026-02-08)
  Stage 2:  IN PROGRESS (started 2026-02-08)
  Stage 3:  NOT STARTED
  Stage 4:  NOT STARTED
  Stage 5:  NOT STARTED
  Stage 6:  NOT STARTED
  Stage 7:  NOT STARTED
  Stage 8:  NOT STARTED
```

### Step 5: Save Before Closing

If you need to pause work and come back later:

```bash
babok save K7M3
```

This timestamps a snapshot in the journal file.

### Step 6: Resume Later

When you return, load the project context:

```bash
babok load K7M3
```

This prints a **context block** that you can copy and paste into your AI chat to resume exactly where you left off:

```
LOAD PROJECT BABOK-20260208-K7M3
Project Name: Document Management System for Acme Corp
Created: 2026-02-08T10:30:00.000Z

Completed stages:
  - Stage 1: Project Initialization & Stakeholder Mapping (approved 2026-02-08)
  - Stage 2: Current State Analysis (AS-IS) (approved 2026-02-09)

Resume at: Stage 3 - Problem Domain Analysis
```

### Step 7: Continue Through All 8 Stages

Repeat the cycle for each stage:

1. Work with AI agent in chat
2. `babok approve <id> <stage>` when done
3. `babok save <id>` if pausing
4. `babok load <id>` to resume

### Step 8: Export Final Deliverables

After all 8 stages are complete:

```bash
babok export K7M3
```

Output:
```
 PROJECT EXPORTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project:         BABOK-20260208-K7M3
  Name:            Document Management System for Acme Corp
  Files:           9 file(s)
  Output:          ./export/BABOK-20260208-K7M3/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

You can also specify a custom output directory:

```bash
babok export K7M3 --output /path/to/client/deliverables
```

---

## Command Reference

### `babok new`

Create a new BABOK analysis project.

```bash
babok new                          # Interactive — prompts for project name
babok new --name "Project Name"    # Non-interactive — uses provided name
babok new -n "Project Name"        # Short form
```

**What it does:**
- Generates a unique Project ID (`BABOK-YYYYMMDD-XXXX`)
- Creates project directory under `./projects/`
- Initializes a journal file with all 8 stages set to "not_started" (Stage 1 set to "in_progress")
- Displays the Project ID and next steps

**Language option:**
```bash
babok new --name "My Project" --language EN    # English project
babok new --name "Mój Projekt" --language PL   # Polish project
babok new -n "Project" -l PL                   # Short form
```

---

### `babok lang`

Set or show the default language for new projects.

```bash
babok lang              # Show current language
babok lang EN           # Set to English
babok lang PL           # Set to Polish
babok lang ENG          # Alias for EN
```

**What it does:**
- Stores language preference in `~/.babok_language`
- Affects default language for `babok new` command
- Affects AI agent response language when using `BEGIN NEW PROJECT` or `ZACZNIJ NOWY PROJEKT`

**Language priority:**
1. Project's stored language (highest priority)
2. `--language` flag on `babok new`
3. Global language setting from `babok lang`
4. English (default)

---

### `babok pl` / `babok eng`

Quick shortcuts to set language.

```bash
babok pl       # Shortcut for: babok lang PL
babok eng      # Shortcut for: babok lang EN
```

**Example workflow:**
```bash
# Set language to Polish
babok pl

# Create new project (will be in Polish by default)
babok new --name "Mój Projekt"

# In AI chat, type:
# ZACZNIJ NOWY PROJEKT
# AI agent will respond in Polish throughout all stages
```

---

### `babok list`

List all projects in the current workspace.

```bash
babok list
babok ls          # Alias
```

**Output columns:** Project ID, Name, Current Stage, Status, Last Updated

**Example:**
```
  ID                     Name                           Stage      Status         Last Updated
  ------------------------------------------------------------------------------------------
  BABOK-20260208-K7M3    Document Management System..   3/8        IN PROGRESS    2026-02-10
  BABOK-20260205-R9TN    CRM Migration                  8/8        COMPLETED      2026-02-07
```

---

### `babok status`

Show detailed status for a project.

```bash
babok status                 # Works if only 1 project exists
babok status K7M3            # Partial ID match
babok status BABOK-20260208-K7M3   # Full ID
```

**Shows:** All 8 stages with status, timestamps, decisions, assumptions, and open questions.

**Partial ID matching:** You only need to type enough of the ID to uniquely identify the project. The 4-character suffix (e.g., `K7M3`) usually works.

---

### `babok approve`

Mark a stage as approved and advance to the next stage.

```bash
babok approve <project_id> <stage_number>
babok approve K7M3 1       # Approve Stage 1
babok approve K7M3 2       # Approve Stage 2
```

**What it does:**
- Sets stage status to "approved" with timestamp
- Automatically sets the next stage to "in_progress"
- After Stage 8, marks the project as "completed"

**Validation:**
- Cannot approve an already-approved stage
- Stage number must be 1-8

---

### `babok reject`

Reject a stage with a reason (requires rework).

```bash
babok reject <project_id> <stage_number> --reason "Missing stakeholder analysis"
babok reject K7M3 2 -r "Incomplete cost baseline"
```

**What it does:**
- Sets stage status to "rejected"
- Records the rejection reason in the journal
- The stage remains at its current number (no advancement)

---

### `babok save`

Save a snapshot of the current project state.

```bash
babok save <project_id>
babok save K7M3
```

**What it does:**
- Updates the `last_updated` timestamp in the journal
- Confirms the save with current progress summary

**When to use:** Before closing your session, at the end of a work day, or any time you want a checkpoint.

---

### `babok load`

Load a project and generate a context block for your AI chat.

```bash
babok load <project_id>
babok load K7M3
```

**What it does:**
1. Reads the project journal
2. Displays full progress overview
3. Prints a **context block** — a formatted text you can copy and paste into your AI chat to restore the conversation context

**The context block includes:**
- Project ID and name
- List of completed stages with dates
- Current stage to resume
- Key decisions made
- Any notes or pending items

---

### `babok export`

Export all project deliverables to an output directory.

```bash
babok export <project_id>
babok export K7M3
babok export K7M3 --output ./client-deliverables
babok export K7M3 -o /path/to/output
```

**What it does:**
- Copies the journal and all `.md` deliverable files from the project directory
- Default output: `./export/<project_id>/`
- Custom output via `--output` flag

---

### `babok make docx`

Generate professional DOCX documents from stage files. Perfect for CEO presentations and formal documentation.

```bash
babok make docx <project_id>
babok make docx K7M3                    # Generate all stage DOCX files
babok make docx K7M3 --stage 1          # Generate only Stage 1
babok make docx K7M3 -s 1 -o ./reports  # Stage 1 to custom directory
```

**Features:**
- **Corporate styling** with professional color scheme (navy blue/accent blue)
- **Formatted tables** with colored headers
- **Proper typography** - Georgia font for headings, Calibri for body text
- **Bullet points** with accent-colored markers
- **Bold text preservation** from markdown
- **Page margins** and spacing optimized for readability

**Output:** Files saved to `<project_dir>/exports/` or custom directory via `--output`.

---

### `babok make pdf`

Generate beautifully formatted PDF documents from stage files. CEO-ready presentation quality.

```bash
babok make pdf <project_id>
babok make pdf K7M3                     # Generate all stage PDFs
babok make pdf K7M3 --stage 2           # Generate only Stage 2
babok make pdf K7M3 -s 1 -o ./reports   # Stage 1 to custom directory
```

**Features:**
- **Executive-grade styling** with Inter/Merriweather fonts
- **Gradient table headers** (navy blue to dark blue)
- **Alternating row colors** for easy reading
- **Accent-colored borders** on headings
- **Page numbers** in footer
- **Header with document title** on each page
- **Professional footer** with project ID and confidentiality note
- **Print-optimized** with proper page break handling

**Output:** Files saved to `<project_dir>/exports/` or custom directory via `--output`.

---

### `babok make all`

Generate both DOCX and PDF documents in one command.

```bash
babok make all <project_id>
babok make all K7M3                     # Generate both formats for all stages
babok make all K7M3 --stage 1           # Both formats for Stage 1 only
```

**Tip:** Use this before client meetings to have both editable (DOCX) and presentation (PDF) versions ready.

---

## Project Journal

Every project maintains a **journal file** (`PROJECT_JOURNAL_<id>.json`) that records the full project lifecycle. This is the single source of truth for project state.

### Journal Location

```
./projects/<project_id>/PROJECT_JOURNAL_<project_id>.json
```

### Journal Contents

```json
{
  "project_id": "BABOK-20260208-K7M3",
  "project_name": "Document Management System for Acme Corp",
  "created_at": "2026-02-08T10:30:00.000Z",
  "last_updated": "2026-02-10T14:45:00.000Z",
  "current_stage": 3,
  "current_status": "in_progress",
  "stages": [
    {
      "stage": 1,
      "name": "Project Initialization & Stakeholder Mapping",
      "status": "approved",
      "started_at": "2026-02-08T10:30:00.000Z",
      "completed_at": "2026-02-08T12:15:00.000Z",
      "approved_at": "2026-02-08T12:20:00.000Z",
      "approved_by": "Human",
      "deliverable_file": "STAGE_01_Project_Initialization.md",
      "notes": ""
    }
  ],
  "decisions": [],
  "assumptions": [],
  "open_questions": []
}
```

### Stage Statuses

| Status | Meaning |
|--------|---------|
| `not_started` | Stage has not begun |
| `in_progress` | Currently active stage |
| `completed` | Stage deliverables generated (awaiting approval) |
| `approved` | Human approved the stage |
| `rejected` | Human rejected the stage (needs rework) |

### Manually Editing the Journal

The journal is a plain JSON file. You can edit it directly if needed:

- Add deliverable file references after saving AI-generated documents
- Add decisions, assumptions, or open questions
- Correct timestamps or notes

---

## Directory Structure

After creating projects and exporting, your workspace looks like:

```
BABOK_ANALYST/
|
|-- cli/                          # CLI tool (installed once)
|   |-- node_modules/             # Dependencies (gitignored)
|   |-- ...
|
|-- projects/                     # Active projects (gitignored)
|   |-- BABOK-20260208-K7M3/
|   |   |-- PROJECT_JOURNAL_BABOK-20260208-K7M3.json
|   |   |-- STAGE_01_Project_Initialization.md      # Place deliverables here
|   |   |-- STAGE_02_Current_State_Analysis.md
|   |   |-- ...
|   |
|   |-- BABOK-20260205-R9TN/
|       |-- ...
|
|-- export/                       # Exported deliverables (gitignored)
|   |-- BABOK-20260208-K7M3/
|       |-- ...
```

**Important:** The `projects/` and `export/` directories are listed in `.gitignore` because they contain project-specific data that should not be committed to the repository.

### Saving AI-Generated Deliverables

When your AI agent generates a stage deliverable, save the content as a `.md` file in the project directory:

```
./projects/BABOK-20260208-K7M3/STAGE_01_Project_Initialization.md
```

Use the naming convention:
```
STAGE_01_Project_Initialization.md
STAGE_02_Current_State_Analysis.md
STAGE_03_Problem_Domain_Analysis.md
STAGE_04_Solution_Requirements.md
STAGE_05_Future_State_Design.md
STAGE_06_Gap_Analysis_Roadmap.md
STAGE_07_Risk_Assessment.md
STAGE_08_Business_Case_ROI.md
FINAL_Complete_Documentation.md
```

These files are included when you run `babok export`.

---

## Tips and Tricks

### Partial ID Matching

You don't need to type the full Project ID. The 4-character suffix is usually enough:

```bash
babok status K7M3          # Instead of: babok status BABOK-20260208-K7M3
babok approve K7M3 1       # Works the same
babok load K7M3             # Works the same
```

If the partial ID matches multiple projects, you'll get an error asking you to be more specific.

### Managing Multiple Projects

```bash
# See all projects at a glance
babok list

# Quick status check for each
babok status K7M3
babok status R9TN
```

### Single-Project Shortcut

If you have only one project, you can omit the ID for `status`:

```bash
babok status    # Automatically selects the only project
```

### Working Across Sessions

A typical multi-session workflow:

**Session 1 (Monday):**
```bash
babok new --name "ERP Integration"    # Create project
# Work through Stage 1 in AI chat
babok approve K7M3 1                  # Approve Stage 1
babok save K7M3                       # Save before closing
```

**Session 2 (Wednesday):**
```bash
babok load K7M3                       # Get context block
# Paste context into AI chat, resume Stage 2
babok approve K7M3 2                  # Approve Stage 2
babok save K7M3                       # Save progress
```

**Session N (Final):**
```bash
babok approve K7M3 8                  # Approve final stage
babok export K7M3                     # Export everything
```

### Running from Any Directory

The CLI looks for the `projects/` directory relative to your **current working directory**. Always run commands from the `BABOK_ANALYST` root:

```bash
cd /path/to/BABOK_ANALYST
babok list
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `babok: command not found` | Run `npm link` in the `cli/` directory |
| `Error: Project not found` | Check the ID with `babok list`, use the correct suffix |
| `Stage is already approved` | You've already approved this stage; check `babok status` |
| `No projects found` | Make sure you're in the `BABOK_ANALYST` directory |
| `Journal not found` | The project directory may have been deleted; check `./projects/` |
| Permission error on `npm link` | On Linux/Mac, use `sudo npm link`. On Windows, run terminal as Administrator |

### Resetting a Project

If you need to start a stage over, edit the journal file directly:

```bash
# Open the journal in your editor
code ./projects/BABOK-20260208-K7M3/PROJECT_JOURNAL_BABOK-20260208-K7M3.json
```

Change the stage status from `"approved"` back to `"in_progress"` and clear the timestamps.

### Getting Help

```bash
babok --help              # All commands
babok new --help          # Help for specific command
babok approve --help      # Help for approve command
```

---

## Requirements

- **Node.js:** 18.0.0 or higher
- **Operating Systems:** Windows, macOS, Linux
- **Dependencies:** commander, chalk, nanoid (installed automatically via `npm install`)

---

**Version:** 1.3.0
**Part of:** [BABOK Analyst](https://github.com/GSkuza/BABOK_ANALYST)
