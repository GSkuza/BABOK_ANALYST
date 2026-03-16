# BABOK-MCP — User Manual

**Server version:** 2.0.2
**Document date:** 2026-03-16
**Author:** BABOK Analyst Project

---

## Table of Contents

1. [What is babok-mcp?](#1-what-is-babok-mcp)
2. [Value proposition — why use it?](#2-value-proposition--why-use-it)
3. [Prerequisites](#3-prerequisites)
4. [Installation](#4-installation)
5. [Client configuration](#5-client-configuration)
   - [Claude Code CLI](#51-claude-code-cli-recommended)
   - [Claude Desktop](#52-claude-desktop)
   - [VS Code Copilot](#53-vs-code-copilot)
   - [Cursor](#54-cursor)
6. [Verifying the connection](#6-verifying-the-connection)
7. [Environment variables](#7-environment-variables)
8. [Tools — detailed reference](#8-tools--detailed-reference)
   - [babok_new_project](#81-babok_new_project)
   - [babok_list_projects](#82-babok_list_projects)
   - [babok_get_stage](#83-babok_get_stage)
   - [babok_approve_stage](#84-babok_approve_stage)
   - [babok_get_deliverable](#85-babok_get_deliverable)
   - [babok_save_deliverable](#86-babok_save_deliverable)
   - [babok_search](#87-babok_search)
   - [babok_export](#88-babok_export)
   - [babok_rename_project](#89-babok_rename_project)
   - [babok_delete_project](#810-babok_delete_project)
9. [Resources — BABOK stages](#9-resources--babok-stages)
10. [Complete session example](#10-complete-session-example)
11. [When and why to use babok-mcp?](#11-when-and-why-to-use-babok-mcp)
12. [Project file structure](#12-project-file-structure)
13. [Troubleshooting](#13-troubleshooting)
14. [FAQ](#14-faq)

---

## 1. What is babok-mcp?

**babok-mcp** is a **Model Context Protocol (MCP)** server — an open standard for integrating tools with AI assistants, created by Anthropic.

This server **wraps the entire BABOK business analysis project lifecycle** in a set of tools that an AI assistant (Claude, Copilot, Cursor, etc.) can invoke automatically during a conversation — without the analyst having to run any terminal commands manually.

### How it works

Traditional workflow without MCP:

```
Analyst → [writes questions] → AI → [replies with text]
Analyst → [manually saves results] → terminal: babok approve ...
Analyst → [moves to next stage]
```

Workflow with babok-mcp:

```
Analyst → "Start Stage 3 for project K7M3"

AI automatically:
  1. calls babok_get_stage(K7M3, 3)
     → receives stage instructions + project state
  2. conducts analysis with the analyst
  3. calls babok_save_deliverable(K7M3, 3, "...")
     → saves the document to an MD file
  4. calls babok_approve_stage(K7M3, 3)
     → approves the stage, moves to stage 4
```

The analyst focuses entirely on **substance** — all project administration happens automatically.

---

## 2. Value proposition — why use it?

### 2.1 Project management automation

Without babok-mcp the analyst must manually:
- switch between the terminal and the AI chat window
- paste project context into every new conversation
- remember which stage the project is on
- manually save results to files

With babok-mcp:
- AI fetches the current project state before every response
- AI saves generated documents automatically
- AI approves stages after the analyst confirms
- project state is always current and consistent

### 2.2 Context continuity across sessions

Each project has a **journal** — a JSON file storing:
- all decisions made
- project assumptions
- open questions
- dates and status of each stage

When you return to a project after a week, the AI reads the journal and immediately knows:
- what has already been done
- what decisions were made
- where to continue from

No need to "remind" the AI about project context.

### 2.3 BABOK methodology standardisation

The server integrates **9 detailed agent prompts** (Stage 0–8) that define the BABOK methodology. Each stage has a precisely defined scope:

| Stage | Name | Output |
|-------|------|--------|
| 0 | Project Charter | Project charter, goals, scope |
| 1 | Project Initialization & Stakeholder Mapping | Stakeholder register |
| 2 | Current State Analysis (AS-IS) | Current state analysis |
| 3 | Problem Domain Analysis | Business problem analysis |
| 4 | Solution Requirements Definition | Functional and non-functional requirements |
| 5 | Future State Design (TO-BE) | Target state design |
| 6 | Gap Analysis & Implementation Roadmap | Gap analysis and schedule |
| 7 | Risk Assessment & Mitigation Strategy | Risk register |
| 8 | Business Case & ROI Model | Business case and ROI |

The AI does not "improvise" methodology — it always applies the same proven analysis patterns.

### 2.4 Search across project knowledge

The `babok_search` tool searches **all documents from all projects** simultaneously. You can ask:

- "Find all requirements related to SAP integration"
- "Show risks identified in previous projects"
- "Where does GDPR compliance appear in the documentation"

This builds an **organisational knowledge base** — each new project draws from the experience of previous ones.

### 2.5 Support for multiple AI clients

The same MCP server works with:
- **Claude Code CLI** — terminal / VS Code work
- **Claude Desktop** — desktop application
- **VS Code Copilot** — directly in the code editor
- **Cursor** — AI-first code editor

One server, multiple interfaces — no duplicated configuration.

### 2.6 Export and documentation

The `babok_export` tool copies all project documents (MD files + journal JSON) to a specified export directory in a single call. Ready for archiving, sharing with a client, or converting to DOCX/PDF.

---

## 3. Prerequisites

Before installation, make sure you have:

| Requirement | Minimum version | How to check |
|-------------|----------------|--------------|
| Node.js | 18.0.0 | `node --version` |
| npm | 9.0.0 | `npm --version` |
| Git | any | `git --version` |
| BABOK_ANALYST repository | cloned | `ls D:/BABOK_ANALYST` |

### Installing Node.js

If Node.js is not installed:

1. Download the installer from: [https://nodejs.org](https://nodejs.org) (LTS version)
2. Install following the installer instructions
3. Restart the terminal and verify: `node --version`

---

## 4. Installation

### Step 1: Clone the repository (if you don't have it)

```bash
git clone https://github.com/GSkuza/BABOK_ANALYST.git D:/BABOK_ANALYST
```

### Step 2: Install MCP server dependencies

**Option A — one-click installer (Windows):**

```bat
cd D:/BABOK_ANALYST/babok-mcp
setup.bat
```

The script automatically installs dependencies, verifies the server file, and displays the ready JSON snippet to paste into `claude_desktop_config.json`.

**Option B — manual:**

```bash
cd D:/BABOK_ANALYST/babok-mcp
npm install
```

After installation, verify the entry point exists:

```bash
ls D:/BABOK_ANALYST/babok-mcp/bin/babok-mcp.js
```

### Step 3: Verify the server

Run the server manually for a few seconds (Ctrl+C to stop):

```bash
node D:/BABOK_ANALYST/babok-mcp/bin/babok-mcp.js
```

The server is working correctly if it does not throw errors (after launch it waits on stdin — this is normal MCP server behaviour).

---

## 5. Client configuration

### 5.1 Claude Code CLI (recommended)

Claude Code CLI is a tool for working with Claude directly from the terminal or VS Code. It is the **simplest integration method** — one command and you're done.

#### One-time configuration:

```bash
claude mcp add babok node "D:/BABOK_ANALYST/babok-mcp/bin/babok-mcp.js" \
  -e BABOK_PROJECTS_DIR="D:/BABOK_ANALYST/projects" \
  -e BABOK_AGENT_DIR="D:/BABOK_ANALYST/BABOK_AGENT/stages"
```

The `claude mcp add` command saves the configuration to `~/.claude.json` (local project file).

#### Verification:

```bash
claude mcp list
```

Expected output:
```
babok: node D:/BABOK_ANALYST/babok-mcp/bin/babok-mcp.js - ✓ Connected
```

#### Removal (when needed):

```bash
claude mcp remove babok
```

---

### 5.2 Claude Desktop

Claude Desktop is a desktop application available on Windows and macOS.

#### Config file location:

| System | Path |
|--------|------|
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |

#### Config file content:

Open the file (or create it if it doesn't exist) and add the `mcpServers` section:

```json
{
  "mcpServers": {
    "babok": {
      "command": "node",
      "args": ["D:/BABOK_ANALYST/babok-mcp/bin/babok-mcp.js"],
      "env": {
        "BABOK_PROJECTS_DIR": "D:/BABOK_ANALYST/projects",
        "BABOK_AGENT_DIR": "D:/BABOK_ANALYST/BABOK_AGENT/stages"
      }
    }
  }
}
```

> **macOS note:** Use Unix paths, e.g. `/Users/username/BABOK_ANALYST/...`

#### Restart the application:

After saving the file, **completely close and relaunch Claude Desktop**. The MCP server will appear in the interface as a 🔧 tools icon.

---

### 5.3 VS Code Copilot

VS Code supports MCP servers directly in GitHub Copilot Chat.

#### Method 1: `.vscode/mcp.json` file in the project

Create a `.vscode/mcp.json` file in the project root:

```json
{
  "servers": {
    "babok": {
      "type": "stdio",
      "command": "node",
      "args": ["D:/BABOK_ANALYST/babok-mcp/bin/babok-mcp.js"],
      "env": {
        "BABOK_PROJECTS_DIR": "D:/BABOK_ANALYST/projects",
        "BABOK_AGENT_DIR": "D:/BABOK_ANALYST/BABOK_AGENT/stages"
      }
    }
  }
}
```

#### Method 2: Global VS Code settings

Add to `settings.json` (`Ctrl+Shift+P` → "Open User Settings JSON"):

```json
{
  "mcp.servers": {
    "babok": {
      "type": "stdio",
      "command": "node",
      "args": ["D:/BABOK_ANALYST/babok-mcp/bin/babok-mcp.js"],
      "env": {
        "BABOK_PROJECTS_DIR": "D:/BABOK_ANALYST/projects",
        "BABOK_AGENT_DIR": "D:/BABOK_ANALYST/BABOK_AGENT/stages"
      }
    }
  }
}
```

After configuration, babok tools will be available in **Copilot Chat** by typing `@babok` or automatically.

---

### 5.4 Cursor

Cursor is an AI-first code editor that supports MCP.

#### Config file: `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "babok": {
      "command": "node",
      "args": ["D:/BABOK_ANALYST/babok-mcp/bin/babok-mcp.js"],
      "env": {
        "BABOK_PROJECTS_DIR": "D:/BABOK_ANALYST/projects",
        "BABOK_AGENT_DIR": "D:/BABOK_ANALYST/BABOK_AGENT/stages"
      }
    }
  }
}
```

Restart Cursor after saving the configuration.

---

## 6. Verifying the connection

After configuring any client, you can verify the server is working:

### In Claude Code CLI:

```bash
claude mcp list
```

### In a conversation with the AI:

Write to the assistant:
> "Call babok_list_projects and show me the project list"

If the server is connected, the AI will execute the tool and display results. If there are no projects, you will see:
```
No projects found. Use babok_new_project to create the first one.
Projects directory: D:/BABOK_ANALYST/projects
```

---

## 7. Environment variables

The server recognises two environment variables:

| Variable | Default value | Description |
|----------|--------------|-------------|
| `BABOK_PROJECTS_DIR` | `./projects` (relative to CWD) | Directory for storing projects (journals + deliverables) |
| `BABOK_AGENT_DIR` | `./BABOK_AGENT/stages` (relative to CWD) | Directory with stage prompt files (`BABOK_agent_stage_N.md`) |

### Path resolution priority:

1. Environment variable (always overrides)
2. `./projects` directory relative to the current working directory
3. `../projects` relative to the `babok-mcp` package

### Example for a custom project location:

```json
{
  "env": {
    "BABOK_PROJECTS_DIR": "C:/MyCompany/BABOKProjects",
    "BABOK_AGENT_DIR": "D:/BABOK_ANALYST/BABOK_AGENT/stages"
  }
}
```

---

## 8. Tools — detailed reference

The server exposes **10 tools**. Each is called automatically by the AI based on your natural language instructions.

---

### 8.1 `babok_new_project`

**Purpose:** Creates a new BABOK business analysis project.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | YES | Project name (e.g. "CRM Implementation for Acme Ltd") |
| `language` | "EN" or "PL" | NO (default "EN") | Analysis language — all documents will be generated in this language |

**What it does:**
- Generates a unique project ID in format `BABOK-YYYYMMDD-XXXX`
- Creates the project directory at `BABOK_PROJECTS_DIR/BABOK-YYYYMMDD-XXXX/`
- Initialises the journal file `PROJECT_JOURNAL_BABOK-YYYYMMDD-XXXX.json`
- Sets Stage 0 (Project Charter) as active

**Example response:**
```
✅ NEW PROJECT CREATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project ID:   BABOK-20260316-K7M3
  Project Name: CRM Implementation for Acme Ltd
  Language:     EN
  Created:      2026-03-16T10:23:45.000Z
  Directory:    D:/BABOK_ANALYST/projects/BABOK-20260316-K7M3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current stage: Stage 0 — Project Charter (IN PROGRESS)
```

**How to invoke (example prompts to the AI):**

```
"Create a new BABOK project for ERP implementation in English"
"Start a new project: Azure Data Migration, language EN"
"New BABOK project: Customer Portal Redesign, language EN"
```

---

### 8.2 `babok_list_projects`

**Purpose:** Displays a list of all projects in the working directory.

**Parameters:** none

**What it does:**
- Scans the `BABOK_PROJECTS_DIR` directory
- For each project reads the journal
- Returns a table with ID, name, current stage, and status

**Example response:**
```
BABOK Projects:
━━━━━━━━━━━━━━━━
  BABOK-20260316-K7M3  |  CRM Implementation for Acme    |  Stage 2: Current State Analysis  |  IN_PROGRESS
  BABOK-20260301-AB4N  |  Azure Data Migration            |  Stage 8: Business Case & ROI     |  COMPLETED
  BABOK-20260210-XP9R  |  Customer Portal                 |  Stage 0: Project Charter         |  IN_PROGRESS
```

**How to invoke:**

```
"Show all BABOK projects"
"What active projects do I have?"
"List projects"
```

---

### 8.3 `babok_get_stage`

**Purpose:** This is the **core tool** of the server. Retrieves full context for working on a stage — methodological instructions + project state + existing deliverable.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | string | YES | Full or partial project ID (e.g. "K7M3" instead of full "BABOK-20260316-K7M3") |
| `stage_n` | number (0–8) | YES | Stage number |

**What it returns (four sections):**

1. **Stage header** — number, name, status, dates
2. **Journal Context** — project summary: all stages, decisions made, assumptions, open questions
3. **Stage Instructions** — full content of `BABOK_agent_stage_N.md` — detailed questions and methodology for that stage
4. **Existing Deliverable** (if it exists) — current stage document for revision or continuation

**Why this matters:**

Without this tool the AI would have to "guess" what to do at each stage. With it:
- always applies the correct BABOK methodology
- knows the current state and project history
- does not re-ask about things already established in previous stages
- can resume mid-stage (has the existing deliverable)

**How to invoke:**

```
"Start working on Stage 3 of project K7M3"
"Get instructions for stage 2"
"What do we need to do in Stage 5 for the Azure Migration project?"
```

---

### 8.4 `babok_approve_stage`

**Purpose:** Approves a completed stage and advances the project to the next one.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | string | YES | Project ID |
| `stage_n` | number (0–8) | YES | Stage number to approve |
| `notes` | string | NO | Optional notes — key decisions made during the stage |

**What it does:**
- Marks the stage as `approved` in the journal
- Records the approval date and notes
- Advances the project to the next stage (status `in_progress`)
- If Stage 8 is approved — project is `DONE`

**Example response:**
```
✅ Stage 2 APPROVED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project:  BABOK-20260316-K7M3
  Stage:    2 — Current State Analysis (AS-IS)
  Approved: 2026-03-16 14:45:22
  Notes:    3 legacy systems identified, no integration between departments

Next: Stage 3 — Problem Domain Analysis (now IN PROGRESS)
Call babok_get_stage with stage_n=3 to continue.
```

**How to invoke:**

```
"Approve Stage 2 — everything looks good"
"Approve stage 2 with note: legacy systems identified"
"Accept the current state analysis stage"
```

---

### 8.5 `babok_get_deliverable`

**Purpose:** Reads the content of a document (deliverable) for a specific stage.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | string | YES | Project ID |
| `stage_n` | number (0–8) | YES | Stage number |

**What it does:**
- Reads the Markdown file from the project directory
- Returns the full document content

**Deliverable filenames:**

| Stage | File |
|-------|------|
| 0 | `STAGE_00_Project_Charter.md` |
| 1 | `STAGE_01_Project_Initialization.md` |
| 2 | `STAGE_02_Current_State_Analysis.md` |
| 3 | `STAGE_03_Problem_Domain_Analysis.md` |
| 4 | `STAGE_04_Solution_Requirements.md` |
| 5 | `STAGE_05_Future_State_Design.md` |
| 6 | `STAGE_06_Gap_Analysis_Roadmap.md` |
| 7 | `STAGE_07_Risk_Assessment.md` |
| 8 | `STAGE_08_Business_Case_ROI.md` |

**How to invoke:**

```
"Show me the document from Stage 4 of project K7M3"
"Read the current Stage 1 deliverable"
"Display the project charter (Stage 0)"
```

---

### 8.6 `babok_save_deliverable`

**Purpose:** Saves an AI-generated stage document as a Markdown file in the project directory.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | string | YES | Project ID |
| `stage_n` | number (0–8) | YES | Stage number |
| `content` | string | YES | Full document content in Markdown format |

**What it does:**
- Saves the file to `BABOK_PROJECTS_DIR/<project_id>/<filename>.md`
- Updates the journal: stage status → `completed`, completion date
- Returns confirmation with the file path and character count

**When the AI calls this tool:**

The AI calls `babok_save_deliverable` automatically after generating a stage document — typically after the analyst has answered all the methodological questions. You don't need to ask for it explicitly.

**How to invoke:**

```
"Save the generated document to the project"
"Preserve Stage 3 analysis results"
"Finalise the Stage 2 deliverable and save"
```

---

### 8.7 `babok_search`

**Purpose:** Full-text search across all Markdown files in all projects (or a single selected project).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | YES | Search phrase (case-insensitive) |
| `project_id` | string | NO | Limit search to a specific project |

**What it does:**
- Scans all `.md` files in all projects
- Returns matching lines with context (line before + line after)
- Limited to 5 matches per file (to avoid flooding the response)

**Example response:**
```
Search results for: "SAP integration"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 BABOK-20260316-K7M3 — CRM Implementation / STAGE_04_Solution_Requirements.md
  Line 87:
    Technical requirements:
    - SAP integration with the CRM module must support real-time sync
    - SAP integration SLA: max 2s latency

📁 BABOK-20260210-XP9R — Customer Portal / STAGE_06_Gap_Analysis_Roadmap.md
  Line 134:
    Identified gap: no SAP integration with the order management system
    Priority: HIGH
```

**Typical use cases:**

```
"Find all security requirements across my projects"
"Search for GDPR mentions in all documents"
"In which projects did data migration come up?"
"Find all risks described as 'high' in project K7M3"
```

---

### 8.8 `babok_export`

**Purpose:** Exports all project files (journal + deliverables) to a specified directory.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | string | YES | Project ID |
| `output_dir` | string | NO | Target path (default: `./export/<project_id>`) |

**What it does:**
- Creates the target directory (if it does not exist)
- Copies all `.md` and `.json` files from the project directory
- Returns confirmation with the number of files copied and the path

**Example response:**
```
📦 PROJECT EXPORTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project:  BABOK-20260316-K7M3
  Name:     CRM Implementation for Acme
  Files:    10 file(s)
  Output:   D:/BABOK_ANALYST/export/BABOK-20260316-K7M3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Typical use cases:**

```
"Export project K7M3 to folder C:/Deliverables/Acme"
"Make a project export for the client"
"Export project to D:/Reports/Q1-2026"
```

After exporting, you can convert MD files to DOCX/PDF using the CLI:

```bash
babok make all K7M3
```

---

### 8.9 `babok_rename_project`

**Purpose:** Renames a project in the journal (without changing the directory ID).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | string | YES | Project ID |
| `new_name` | string | YES | New project name |

**What it does:**
- Updates the `project_name` field in the journal JSON file
- Records the change date and previous name in the history
- Returns confirmation

**How to invoke:**

```
"Rename project K7M3 to 'CRM Implementation v2 — extended scope'"
"Rename project K7M3 to 'CRM Phase 2'"
```

---

### 8.10 `babok_delete_project`

**Purpose:** Permanently deletes a project after confirmation.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | string | YES | Project ID |
| `confirm` | boolean | YES | Must be `true` — requires explicit confirmation |

**What it does:**
- Requires `confirm: true` — the AI will not call this without explicit consent
- Removes the project directory from `BABOK_PROJECTS_DIR`
- The operation is **irreversible**

**How to invoke:**

```
"Delete project K7M3 — confirm deletion"
"Delete project K7M3, I confirm"
```

> ⚠️ **Warning:** Before requesting deletion, it is worth exporting the project first via `babok_export`.

---

## 9. Resources — BABOK stages

The server also exposes **9 MCP resources** — stage prompt files available at URIs:

| URI | Stage | Content |
|-----|-------|---------|
| `babok://stages/0` | Stage 0 | Project Charter creation instructions |
| `babok://stages/1` | Stage 1 | Stakeholder mapping methodology |
| `babok://stages/2` | Stage 2 | Current State Analysis (AS-IS) |
| `babok://stages/3` | Stage 3 | Problem domain analysis |
| `babok://stages/4` | Stage 4 | Solution requirements definition |
| `babok://stages/5` | Stage 5 | Future State Design (TO-BE) |
| `babok://stages/6` | Stage 6 | Gap analysis and implementation roadmap |
| `babok://stages/7` | Stage 7 | Risk assessment and mitigation strategies |
| `babok://stages/8` | Stage 8 | Business Case and ROI model |

These resources are read automatically by the `babok_get_stage` tool — you do not need to invoke them manually.

---

## 10. Complete session example

Below is a full session conducting a business analysis through the first 3 stages.

---

### Session 1: Project initialisation

**Analyst to AI:**
> "Create a new BABOK project for CRM implementation at Acme Ltd, language English"

**AI calls:** `babok_new_project({ name: "CRM Implementation at Acme Ltd", language: "EN" })`

**AI responds:**
> Project created: **BABOK-20260316-K7M3**. Starting Stage 0 — Project Charter.

**AI calls:** `babok_get_stage({ project_id: "K7M3", stage_n: 0 })`

**AI conducts the conversation** (questions from `BABOK_agent_stage_0.md`):
> 1. What is the primary business goal of this implementation?
> 2. What is the planned budget and timeline?
> 3. Who is the project sponsor?

**Analyst answers** the questions...

**AI calls:** `babok_save_deliverable({ project_id: "K7M3", stage_n: 0, content: "# Project Charter\n..." })`

**Analyst:**
> "Looks good, approve Stage 0"

**AI calls:** `babok_approve_stage({ project_id: "K7M3", stage_n: 0, notes: "Goal: increase sales by 20% in 18 months" })`

---

### Session 2 (next day): Continuation

**Analyst to AI:**
> "Continue project K7M3 — we're on Stage 1"

**AI calls:** `babok_get_stage({ project_id: "K7M3", stage_n: 1 })`

The AI sees in the journal that Stage 0 is approved with the goal note. **It does not re-ask about project basics** — it continues from Stage 1 with full context.

---

### Session 3: Searching knowledge from previous projects

**Analyst to AI:**
> "Before we start Stage 4, check if previous projects had similar integration requirements"

**AI calls:** `babok_search({ query: "CRM integration" })`

The AI presents findings from previous projects — the analyst can use this knowledge in the current project.

---

### Project finalisation

**After completing Stage 8:**

**Analyst:**
> "Export project K7M3 to folder D:/Deliverables/Acme-CRM"

**AI calls:** `babok_export({ project_id: "K7M3", output_dir: "D:/Deliverables/Acme-CRM" })`

The export directory contains:
```
D:/Deliverables/Acme-CRM/
├── PROJECT_JOURNAL_BABOK-20260316-K7M3.json
├── STAGE_00_Project_Charter.md
├── STAGE_01_Project_Initialization.md
├── STAGE_02_Current_State_Analysis.md
├── STAGE_03_Problem_Domain_Analysis.md
├── STAGE_04_Solution_Requirements.md
├── STAGE_05_Future_State_Design.md
├── STAGE_06_Gap_Analysis_Roadmap.md
├── STAGE_07_Risk_Assessment.md
└── STAGE_08_Business_Case_ROI.md
```

---

## 11. When and why to use babok-mcp?

### Use babok-mcp when:

| Situation | Why it's worth it |
|-----------|------------------|
| **Conducting formal business analyses** | Automatic BABOK methodology, each stage has the right questions and structure |
| **Working on multiple projects in parallel** | `babok_list_projects` + `babok_get_stage` give instant context |
| **Returning to a project after a break** | Journal stores history — no context loss |
| **Building an organisational knowledge base** | `babok_search` searches all projects |
| **Creating client documentation** | `babok_export` + CLI = ready DOCX/PDF reports |
| **Working in a team** | Shared `BABOK_PROJECTS_DIR` = shared project base |
| **Integrating AI into the BA process** | AI becomes a virtual analyst who knows the methodology |

### Do NOT use babok-mcp when:

| Situation | Alternative |
|-----------|------------|
| You need a one-off ad-hoc analysis | Plain conversation with Claude without tools |
| You want to connect to claude.ai in the browser | Requires exposing an HTTP server (ngrok + rebuild) |
| Projects are classified/secret | Ensure project paths are on a secure drive |

---

## 12. Project file structure

After completing a full analysis, each project contains:

```
BABOK_ANALYST/projects/
└── BABOK-20260316-K7M3/
    ├── PROJECT_JOURNAL_BABOK-20260316-K7M3.json   ← project journal
    ├── STAGE_00_Project_Charter.md                ← Project Charter
    ├── STAGE_01_Project_Initialization.md         ← Stakeholders
    ├── STAGE_02_Current_State_Analysis.md         ← AS-IS analysis
    ├── STAGE_03_Problem_Domain_Analysis.md        ← Business problems
    ├── STAGE_04_Solution_Requirements.md          ← Requirements
    ├── STAGE_05_Future_State_Design.md            ← TO-BE design
    ├── STAGE_06_Gap_Analysis_Roadmap.md           ← Gap analysis + roadmap
    ├── STAGE_07_Risk_Assessment.md                ← Risk register
    └── STAGE_08_Business_Case_ROI.md              ← Business justification
```

### Journal JSON structure:

```json
{
  "project_id": "BABOK-20260316-K7M3",
  "project_name": "CRM Implementation at Acme Ltd",
  "language": "EN",
  "created_at": "2026-03-16T10:23:45.000Z",
  "last_updated": "2026-03-16T14:45:22.000Z",
  "current_stage": 3,
  "current_status": "in_progress",
  "stages": [
    {
      "stage": 0,
      "name": "Project Charter",
      "status": "approved",
      "started_at": "2026-03-16T10:23:45.000Z",
      "approved_at": "2026-03-16T11:15:00.000Z",
      "notes": "Goal: increase sales by 20% in 18 months",
      "deliverable_file": "STAGE_00_Project_Charter.md"
    }
  ],
  "decisions": [],
  "assumptions": [],
  "open_questions": []
}
```

---

## 13. Troubleshooting

### Problem: Server does not start

**Symptom:** `claude mcp list` shows an error or no `babok` server

**Solutions:**

1. Check that Node.js is installed:
   ```bash
   node --version
   # Must be >= 18
   ```

2. Check that dependencies are installed:
   ```bash
   ls D:/BABOK_ANALYST/babok-mcp/node_modules/@modelcontextprotocol
   # Must exist
   ```

3. If missing — reinstall:
   ```bash
   cd D:/BABOK_ANALYST/babok-mcp && npm install
   ```

4. Run the server manually and check for errors:
   ```bash
   node D:/BABOK_ANALYST/babok-mcp/bin/babok-mcp.js
   ```

---

### Problem: "Stage prompt file not found"

**Symptom:** AI responds that it cannot find the stage instruction file

**Solution:** Check the `BABOK_AGENT_DIR` variable:

```bash
ls D:/BABOK_ANALYST/BABOK_AGENT/stages/
# Files BABOK_agent_stage_0.md ... BABOK_agent_stage_8.md must exist
```

If the files are in a different location, update the config:
```json
"BABOK_AGENT_DIR": "path/to/stages/directory"
```

---

### Problem: "Project not found"

**Symptom:** AI cannot find the project by ID

**Solution 1:** Check that the project exists:
```bash
ls D:/BABOK_ANALYST/projects/
```

**Solution 2:** Use a full or partial ID — the server accepts e.g. `K7M3` instead of the full `BABOK-20260316-K7M3`.

**Solution 3:** Check `BABOK_PROJECTS_DIR` — it may be pointing to a different directory than you think.

---

### Problem: Changes are not visible after restart

**Symptom:** After restarting Claude Desktop/Code, the server doesn't see new projects

**Solution:** The server runs as a separate process — it reads files from disk in real time. If the problem persists, check permissions on the `projects/` directory.

---

### Problem: "No matches found" when searching

**Symptom:** `babok_search` doesn't find expected results

**Possible causes:**
- Stage documents haven't been saved by the AI yet (no `babok_save_deliverable` called)
- The search phrase is in a different language than the documents
- Search is case-insensitive but requires an exact fragment match

---

## 14. FAQ

**Q: Can I use babok-mcp without the BABOK_ANALYST CLI?**
A: Yes. The MCP server is independent — it does not require the global `babok` command. You only need the `babok-mcp.js` file and the stage prompts directory.

**Q: Does the AI automatically go through all 9 stages?**
A: No — the AI waits for analyst approval at each stage. Every stage requires human interaction. If you want automatic progression, use the `babok run` command in the CLI.

**Q: Where are projects stored?**
A: In the directory specified by `BABOK_PROJECTS_DIR` (default: `D:/BABOK_ANALYST/projects/`). Each project is a separate subdirectory with `.md` and `.json` files.

**Q: Can I rename a project after it has been created?**
A: Yes. The `babok_rename_project` tool renames the project directly via MCP. You can also use `babok rename` in the CLI.

**Q: How do I delete a project?**
A: Use the `babok_delete_project` tool — it requires explicit `confirm: true` parameter, so it is protected against accidental deletion. You can also use `babok delete` in the CLI, or manually remove the project directory.

**Q: What happens if I approve a stage that has no deliverable yet?**
A: The server will approve the stage (updates the journal), but the deliverable file will not be created automatically. You can add it later via `babok_save_deliverable`.

**Q: Can multiple people work on the same project?**
A: Yes, if `BABOK_PROJECTS_DIR` points to a shared network folder or drive. However, there is no file locking mechanism at the MCP level — avoid concurrent work on the same stage. The CLI (`babok chat`) does have stage-level file locking.

**Q: Does the server support languages other than EN and PL?**
A: The `language` parameter only accepts `EN` or `PL`. However, the AI can generate content in other languages if asked — the `language` in the journal controls the default language of the BABOK agent's responses.

**Q: How do I update the server to a newer version?**
A: Run `git pull` in the `BABOK_ANALYST` directory, then `npm install` in `babok-mcp/`. No MCP config changes needed.

---

*Documentation generated for babok-mcp v2.0.2 — BABOK Analyst Project*
*Repository: https://github.com/GSkuza/BABOK_ANALYST*
