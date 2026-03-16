# babok-mcp — MCP Server for BABOK Agent

> Expose BABOK project management to **Claude**, **GPT-4o**, and any MCP-compatible AI assistant — without leaving your chat interface.

[![Version](https://img.shields.io/badge/version-2.0.0-blue)](https://github.com/GSkuza/BABOK_ANALYST)
[![MCP](https://img.shields.io/badge/MCP-compatible-green)](https://modelcontextprotocol.io)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

---

## What is this?

`babok-mcp` is a **Model Context Protocol server** that wraps the BABOK Agent project lifecycle management in a set of tools your AI assistant can call directly.

Instead of running `babok approve K7M3 2` in a terminal, Claude (or any MCP-compatible model) can call `babok_approve_stage` directly — while reading stage instructions from the embedded BABOK Agent prompts.

```
You (in Claude):  "Start Stage 3 analysis for project K7M3"

Claude calls:     babok_get_stage({ project_id: "K7M3", stage_n: 3 })
                  → receives full prompt + journal state
                  → works through problem analysis
                  → calls babok_save_deliverable(...)
                  → calls babok_approve_stage(...)
```

---

## Quick Start — Claude Code / Claude Desktop

### 1. Install

```bash
cd BABOK_ANALYST/babok-mcp
npm install
```

### 2. Configure in Claude

Add to your `claude_desktop_config.json` or `.claude/mcp.json`:

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

> **Claude Desktop config location:**
> - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
> - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

### 3. Restart Claude Desktop

The `babok` server will appear in the MCP panel. You'll see a 🔧 icon indicating tools are available.

---

## Using with `npx` (no clone needed)

If you publish this to npm, users can run:

```json
{
  "mcpServers": {
    "babok": {
      "command": "npx",
      "args": ["babok-mcp"],
      "env": {
        "BABOK_PROJECTS_DIR": "./projects",
        "BABOK_AGENT_DIR": "./BABOK_AGENT/stages"
      }
    }
  }
}
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `BABOK_PROJECTS_DIR` | `./projects` (relative to CWD) | Where project journals and deliverables are stored |
| `BABOK_AGENT_DIR` | `./BABOK_AGENT/stages` (relative to CWD) | Where stage prompt files (`BABOK_agent_stage_N.md`) live |

---

## Tools

### `babok_new_project`
Create a new BABOK analysis project.

```
Input:  name (string), language ("EN"|"PL", default "EN")
Output: Project ID, directory path, next steps
```

### `babok_list_projects`
List all projects in the workspace.

```
Input:  (none)
Output: Table of project IDs, names, current stages, statuses
```

### `babok_get_stage`
**The core tool.** Get everything needed to work on a stage:
- Full stage instructions from `BABOK_agent_stage_N.md`
- Current journal state (all stages, decisions, assumptions)
- Existing deliverable content (if already generated)

```
Input:  project_id (string), stage_n (0–8)
Output: Merged context block — prompt + journal + deliverable
```

### `babok_approve_stage`
Mark a stage as approved and advance to the next one.

```
Input:  project_id (string), stage_n (0–8), notes? (string)
Output: Confirmation + next stage instructions
```

### `babok_get_deliverable`
Read the Markdown file for a completed stage.

```
Input:  project_id (string), stage_n (0–8)
Output: Full Markdown content of the deliverable
```

### `babok_save_deliverable`
Save AI-generated stage content to the project directory.

```
Input:  project_id (string), stage_n (0–8), content (string)
Output: Confirmation, file path, updated stage status
```

### `babok_search`
Full-text search across all project deliverables.

```
Input:  query (string), project_id? (string, optional filter)
Output: Matching lines with file + line number context
```

### `babok_export`
Export all project files to an output directory.

```
Input:  project_id (string), output_dir? (string)
Output: Summary of exported files and destination path
```

---

## Resources

The server also exposes all 9 stage prompt files as MCP resources:

| URI | Description |
|-----|-------------|
| `babok://stages/0` | Stage 0: Project Charter |
| `babok://stages/1` | Stage 1: Project Initialization & Stakeholder Mapping |
| `babok://stages/2` | Stage 2: Current State Analysis (AS-IS) |
| `babok://stages/3` | Stage 3: Problem Domain Analysis |
| `babok://stages/4` | Stage 4: Solution Requirements Definition |
| `babok://stages/5` | Stage 5: Future State Design (TO-BE) |
| `babok://stages/6` | Stage 6: Gap Analysis & Implementation Roadmap |
| `babok://stages/7` | Stage 7: Risk Assessment & Mitigation Strategy |
| `babok://stages/8` | Stage 8: Business Case & ROI Model |

---

## Example Session in Claude

```
User: Start a new BABOK project for "SAP integration at Acme"

Claude: [calls babok_new_project({ name: "SAP integration at Acme", language: "EN" })]
        ✅ Created: BABOK-20260316-K7M3

Claude: [calls babok_get_stage({ project_id: "K7M3", stage_n: 0 })]
        [reads Stage 0 prompt, starts asking questions]

User:  [answers 3 Project Charter questions]

Claude: [calls babok_save_deliverable({ project_id: "K7M3", stage_n: 0, content: "..." })]
        [calls babok_approve_stage({ project_id: "K7M3", stage_n: 0 })]
        ✅ Stage 0 approved. Moving to Stage 1.
```

---

## Running Tests

```bash
cd babok-mcp
npm test
```

The smoke test validates all core journal operations using a temporary directory.

---

## Architecture

```
babok-mcp/
├── bin/
│   └── babok-mcp.js          # Entry point (#!/usr/bin/env node)
├── src/
│   ├── server.js             # MCP Server — 8 tools + 9 resources
│   ├── lib/
│   │   ├── project.js        # ID generation, path resolution, file I/O
│   │   └── journal.js        # Journal CRUD, stage transitions
│   └── test/
│       └── smoke.js          # Core logic smoke tests (10 assertions)
├── package.json
└── README.md
```

---

## Compatibility

| Client | Supported |
|--------|-----------|
| Claude Desktop | ✅ |
| Claude Code | ✅ |
| VS Code (Copilot MCP) | ✅ |
| Cursor | ✅ |
| Any MCP 1.x client | ✅ |

---

## License

MIT — see [LICENSE](../LICENSE)
