> **Version:** 2.0 | **Status:** Draft | **Date:** 2026-03-30

# Migration Guide: L1 → L2 (Multi-Agent Orchestration)

This guide walks an existing BABOK Analyst L1 user through every step needed to upgrade to the L2 Multi-Agent Orchestration architecture.

Prerequisites: a working L1 installation (v1.8+) with at least one completed project.

Architecture overview: [`L2_L3_ARCHITECTURE.md`](./L2_L3_ARCHITECTURE.md)

---

## Table of Contents

1. [Prerequisites Check](#1-prerequisites-check)
2. [Context Store Upgrade (v1.x → v2.0)](#2-context-store-upgrade-v1x--v20)
3. [agent_config.json Upgrade](#3-agent_configjson-upgrade)
4. [MCP Tools Activation](#4-mcp-tools-activation)
5. [Quality Gate Configuration](#5-quality-gate-configuration)
6. [First L2 Run](#6-first-l2-run)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Prerequisites Check

Before starting the migration, verify all requirements are met.

### 1.1 Node.js Version

```bash
node --version
# Required: v18.0.0 or higher
# Recommended: v20 LTS
```

If your version is below v18, upgrade via [nodejs.org](https://nodejs.org) or `nvm`:

```bash
nvm install 20
nvm use 20
```

### 1.2 Gemini API Key

The orchestrator and deep-analysis agents require a valid Gemini API key.

```bash
# Check if already configured
cat .env | grep GEMINI_API_KEY

# If missing, add to .env (never commit .env to git):
echo "GEMINI_API_KEY=your_key_here" >> .env
```

> **Note:** The `.env` file is listed in `.gitignore`. Do not add secrets to `agent_config.json`.

### 1.3 Optional: Jira, GitHub, Confluence Tokens

Required only if you want to use the enterprise integration MCP tools. Add to `.env`:

```bash
# Jira (for babok_create_jira_epic)
JIRA_BASE_URL=https://your-org.atlassian.net
JIRA_USER=your-email@example.com
JIRA_API_TOKEN=your_jira_api_token

# GitHub (for babok_create_github_issues)
GITHUB_TOKEN=ghp_your_token_here

# Confluence (for babok_sync_stage_artifact)
CONFLUENCE_BASE_URL=https://your-org.atlassian.net/wiki
CONFLUENCE_USER=your-email@example.com
CONFLUENCE_API_TOKEN=your_confluence_api_token
```

### 1.4 Verification Checklist

| Check | Command | Expected |
|-------|---------|----------|
| Node.js ≥ 18 | `node --version` | `v18.x.x` or higher |
| npm packages installed | `ls node_modules` in `cli/` | Directory exists |
| MCP packages installed | `ls node_modules` in `babok-mcp/` | Directory exists |
| Gemini key present | `grep GEMINI_API_KEY .env` | Non-empty value |
| Existing project loads | `babok load BABOK-XXXXXX` | Project summary displayed |

---

## 2. Context Store Upgrade (v1.x → v2.0)

The context store (`my_project_context.json`) gains new top-level fields in v2.0. Existing fields are preserved unchanged.

### 2.1 What Changes

| Field | v1.x | v2.0 |
|-------|------|------|
| `schema_version` | absent | `"2.0"` (new) |
| `project_name` | string | moved inside `project.name` (new wrapper) |
| `stages` | absent | per-stage status tracking (new) |
| `quality_reports` | absent | per-stage quality scores (new) |
| `agent_messages` | absent | inter-agent message log (new) |
| `decisions` | absent | decision log array (new) |
| `assumptions` | absent | assumptions log array (new) |
| `risks` | absent | risks log array (new) |

> **Backward compatibility:** All original fields (`company`, `scope`, `pain_points`, `budget`, `timeline`, `stakeholders`, `constraints`, `language`) are preserved under `project` in v2.0.

### 2.2 Manual Migration Steps

**Step 1:** Open your existing `my_project_context.json`. It looks similar to:

```json
{
  "project_name": "Invoice System",
  "language": "EN",
  "company": { "name": "Acme Corp", "industry": "manufacturing" },
  "scope": "...",
  "pain_points": ["..."],
  "budget": { "estimated": "€50,000" },
  "timeline": { "target_date": "2026-06-01" },
  "stakeholders": { "key_decision_makers": ["CFO"] },
  "constraints": ["..."]
}
```

**Step 2:** Add the v2.0 wrapper fields. Your migrated file should look like:

```json
{
  "schema_version": "2.0",
  "project": {
    "id": "BABOK-20260330-XXXX",
    "name": "Invoice System",
    "language": "EN",
    "created_at": "2026-01-15T10:00:00Z",
    "last_updated": "2026-03-30T07:48:39Z",
    "company": { "name": "Acme Corp", "industry": "manufacturing" },
    "scope": "...",
    "pain_points": ["..."],
    "budget": { "estimated": "€50,000" },
    "timeline": { "target_date": "2026-06-01" },
    "stakeholders": { "key_decision_makers": ["CFO"] },
    "constraints": ["..."]
  },
  "stages": {
    "stage1": { "status": "approved", "artifacts": [], "approved_at": null, "approved_by": null },
    "stage2": { "status": "not_started", "artifacts": [], "approved_at": null, "approved_by": null },
    "stage3": { "status": "not_started", "artifacts": [], "approved_at": null, "approved_by": null },
    "stage4": { "status": "not_started", "artifacts": [], "approved_at": null, "approved_by": null },
    "stage5": { "status": "not_started", "artifacts": [], "approved_at": null, "approved_by": null },
    "stage6": { "status": "not_started", "artifacts": [], "approved_at": null, "approved_by": null },
    "stage7": { "status": "not_started", "artifacts": [], "approved_at": null, "approved_by": null },
    "stage8": { "status": "not_started", "artifacts": [], "approved_at": null, "approved_by": null }
  },
  "quality_reports": {},
  "agent_messages": [],
  "decisions": [],
  "assumptions": [],
  "risks": []
}
```

**Step 3:** For each stage already completed in your L1 project, update the corresponding stage status:

```json
"stage1": {
  "status": "approved",
  "artifacts": [
    {
      "type": "markdown",
      "path": "BABOK_Analysis/BABOK-20260330-XXXX/STAGE_01_Project_Initialization.md"
    }
  ],
  "approved_at": "2026-01-16T14:00:00Z",
  "approved_by": "human"
}
```

### 2.3 Validation

After migration, validate the file against the JSON Schema:

```bash
# Install ajv-cli if not present
npm install -g ajv-cli

# Validate
ajv validate \
  --schema BABOK_AGENT/agents/context_schema_v2.json \
  --data my_project_context.json

# Expected output: "my_project_context.json valid"
```

---

## 3. agent_config.json Upgrade

The `agent_config.json` file gains four new top-level sections: `orchestrator`, `agents`, `mcp`, and `context_store`.

### 3.1 Diff: Old vs New

```diff
 {
   "agent": { ... },            ← unchanged
   "capabilities": [ ... ],     ← unchanged
   "techniques": [ ... ],       ← unchanged
   "deliverables": [ ... ],     ← unchanged
   "babok_knowledge_areas": [ ... ], ← unchanged
   "context": { ... },          ← unchanged
   "quality_standards": [ ... ], ← unchanged
   "llm": { ... },              ← unchanged
+  "orchestrator": {
+    "name": "BABOK Orchestrator",
+    "version": "2.0",
+    "model": { "provider": "gemini", "model": "gemini-2.0-flash", "temperature": 0.3 },
+    "pipeline": {
+      "mode": "sequential_with_parallel_options",
+      "parallel_groups": [["stage2", "stage7_initial_risk_scan"]],
+      "mandatory_sequence": ["stage1", "stage3", "stage4", "stage5", "stage6", "stage8"]
+    },
+    "quality_gate": { "enabled": true, "agent": "quality_audit", "min_score": 75, "max_iterations": 3, "escalate_to_human_after": 3 }
+  },
+  "agents": {
+    "stage1": { "model": "gemini-2.0-flash", "temperature": 0.7, "mode": "standard" },
+    "stage2": { "model": "gemini-2.0-flash", "temperature": 0.7, "mode": "standard" },
+    "stage3": { "model": "gemini-pro", "temperature": 0.5, "mode": "deep_analysis" },
+    "stage4": { "model": "gemini-pro", "temperature": 0.5, "mode": "deep_analysis" },
+    "stage5": { "model": "gemini-2.0-flash", "temperature": 0.7, "mode": "standard" },
+    "stage6": { "model": "gemini-pro", "temperature": 0.5, "mode": "deep_analysis" },
+    "stage7": { "model": "gemini-2.0-flash", "temperature": 0.7, "mode": "standard" },
+    "stage8": { "model": "gemini-pro", "temperature": 0.5, "mode": "deep_analysis" },
+    "quality_audit": { "model": "gemini-pro", "temperature": 0.3, "mode": "deep_analysis", "max_iterations": 3, "min_score": 75 }
+  },
+  "mcp": {
+    "server": "./babok-mcp/src/server.js",
+    "tools": ["file_system", "babok_create_jira_epic", "babok_create_github_issues",
+              "babok_read_external_context", "babok_quality_check", "babok_sync_stage_artifact",
+              "babok_get_stage_artifact"],
+    "enabled": true
+  },
+  "context_store": {
+    "type": "json_file",
+    "path": "./my_project_context.json",
+    "schema_version": "2.0",
+    "schema_file": "./BABOK_AGENT/agents/context_schema_v2.json"
+  }
 }
```

### 3.2 Verification

```bash
# Verify JSON is valid
node -e "require('./agent_config.json'); console.log('agent_config.json: valid JSON')"

# Check required L2 keys are present
node -e "
  const c = require('./agent_config.json');
  ['orchestrator','agents','mcp','context_store'].forEach(k => {
    console.log(k + ': ' + (c[k] ? 'present' : 'MISSING'));
  });
"
```

Expected output:
```
agent_config.json: valid JSON
orchestrator: present
agents: present
mcp: present
context_store: present
```

---

## 4. MCP Tools Activation

### 4.1 Install Dependencies

The new tools may require additional npm packages. From the `babok-mcp/` directory:

```bash
cd babok-mcp
npm install
```

If any of the new tools use external packages (e.g. `pdf-parse` for `babok_read_external_context`), install them explicitly:

```bash
npm install pdf-parse node-fetch
```

### 4.2 Verify Existing MCP Server

```bash
cd babok-mcp
node src/server.js --list-tools 2>/dev/null || echo "Server started (no --list-tools flag)"
```

> The existing server uses stdio transport. To inspect available tools, connect an MCP client (e.g. the Claude Desktop app or `mcp-cli`).

### 4.3 Enable New Tools in server.js

After the implementation phase (Roadmap Phase 2), verify the five new tools are registered:

```bash
node -e "
  // Quick smoke test: parse server.js and check tool names
  const fs = require('fs');
  const src = fs.readFileSync('babok-mcp/src/server.js', 'utf8');
  const tools = ['babok_create_jira_epic','babok_create_github_issues',
                 'babok_read_external_context','babok_quality_check','babok_sync_stage_artifact'];
  tools.forEach(t => console.log(t + ': ' + (src.includes(t) ? 'found' : 'NOT FOUND')));
"
```

### 4.4 Run MCP Tests

```bash
cd babok-mcp
npm test
```

All existing tests should continue to pass. New tool tests (in `src/test/`) should also pass.

---

## 5. Quality Gate Configuration

### 5.1 Default Configuration

The quality gate is enabled by default in `orchestrator_config.json` with:

- **Minimum score:** 75 / 100
- **Max iterations:** 3
- **Escalation:** After 3 failed iterations → human review required

### 5.2 Adjusting Thresholds

To lower the quality threshold for development/testing:

```json
// In BABOK_AGENT/agents/orchestrator_config.json
"quality_gate": {
  "enabled": true,
  "agent": "quality_audit",
  "min_score": 60,          ← lower for dev/testing
  "max_iterations": 2,       ← fewer iterations for speed
  "escalate_to_human_after": 2
}
```

### 5.3 Disabling the Quality Gate

To run L2 without the L3 quality loop (useful when first setting up):

```json
"quality_gate": {
  "enabled": false
}
```

When disabled, every stage is automatically approved after completion.

### 5.4 Per-Stage Threshold Override

You can set a stricter threshold for specific stages:

```json
"agents": {
  "stage4": {
    "model": "gemini-pro",
    "mode": "deep_analysis",
    "quality_gate_override": { "min_score": 85 }
  }
}
```

---

## 6. First L2 Run

### 6.1 Start the MCP Server

The MCP server runs as a background process (stdio transport for LLM tool calls):

```bash
cd babok-mcp
npm start &
```

Or, if using the CLI:

```bash
babok setup
```

### 6.2 Create a New L2 Project

```bash
babok new --mode l2
```

Or with the existing CLI:

```bash
babok new
```

The orchestrator will detect `schema_version: "2.0"` in `agent_config.json` and activate the multi-agent pipeline.

### 6.3 Run the Pipeline

```bash
babok run BABOK-20260330-XXXX
```

Expected terminal output (L2 mode):

```
[OrchestratorAgent] Starting pipeline for BABOK-20260330-XXXX
[OrchestratorAgent] Executing Stage1Agent...
[Stage1Agent] Project Initialization complete → context store updated
[QualityAuditAgent] Auditing stage1... score: 88/100 → APPROVED
[OrchestratorAgent] Executing Stage2Agent + Stage7Agent (parallel)...
[Stage2Agent] Current State Analysis complete
[Stage7Agent] Initial Risk Scan complete
[QualityAuditAgent] Auditing stage2... score: 79/100 → APPROVED
[QualityAuditAgent] Auditing stage7... score: 72/100 → iterate (1/3)
[Stage7Agent] Revising based on quality issues...
[QualityAuditAgent] Auditing stage7... score: 81/100 → APPROVED
[OrchestratorAgent] Executing Stage3Agent (Deep Mode)...
...
[OrchestratorAgent] All stages complete. Final documentation generated.
```

### 6.4 Check Quality Reports

After the run, quality reports are stored in the context store:

```bash
node -e "
  const ctx = require('./my_project_context.json');
  Object.entries(ctx.quality_reports).forEach(([stage, report]) => {
    console.log(stage + ': overall=' + report.overall + ' passed=' + report.passed);
  });
"
```

---

## 7. Troubleshooting

### 7.1 "schema_version not found" Error

**Symptom:** Orchestrator refuses to start, logs `context store schema_version must be "2.0"`.

**Fix:** Run the context store migration (Section 2) and ensure `schema_version: "2.0"` is the first key in `my_project_context.json`.

---

### 7.2 MCP Tool Returns "Missing environment variable"

**Symptom:** `babok_create_jira_epic` returns `{ "error": "JIRA_BASE_URL is not set" }`.

**Fix:** Add the required variable to `.env` (see Section 1.3). The tool gracefully returns an error instead of crashing the pipeline.

---

### 7.3 QualityAuditAgent Always Escalates to Human

**Symptom:** Every stage triggers escalation after 3 iterations. No stage reaches `approve`.

**Causes and fixes:**

| Cause | Fix |
|-------|-----|
| `min_score` set too high (e.g. 95) | Lower to 75 in `orchestrator_config.json` |
| Gemini API key has insufficient quota | Check usage at [Google AI Studio](https://aistudio.google.com) |
| Artefact file not found at expected path | Verify `stages.stageN.artifacts[0].path` in context store |
| LLM response not valid JSON | Check `BABOK_AGENT/agents/quality_audit_agent.md` — output format section must instruct strict JSON output |

---

### 7.4 Parallel Stage Execution Fails

**Symptom:** Stage 2 and Stage 7 start in parallel but one fails silently.

**Fix:** Check that both agents have access to the Stage 1 artefact:

```bash
node -e "
  const ctx = require('./my_project_context.json');
  const s1 = ctx.stages.stage1;
  console.log('Stage1 status:', s1.status);
  console.log('Stage1 artifacts:', JSON.stringify(s1.artifacts));
"
```

If `stage1.artifacts` is empty, re-run Stage 1 or manually add the artifact path.

---

### 7.5 `babok run` Command Not Found

**Symptom:** `babok: command not found` or `babok run` throws unknown command.

**Fix:**

```bash
# Re-link the CLI
cd cli
npm install
npm link

# Verify
babok --version
```

---

### 7.6 Context Store Validation Fails After Migration

**Symptom:** `ajv validate` reports errors after migration.

**Common issues:**

| Error Message | Fix |
|---------------|-----|
| `"stages" must be object` | Ensure `stages` is an object (not array), with keys `stage1`..`stage8` |
| `"quality_reports" must be object` | Add `"quality_reports": {}` if missing |
| `"agent_messages" must be array` | Add `"agent_messages": []` if missing |
| `additionalProperties` error | Old root-level fields (`project_name`, `language`, etc.) must be moved inside `project` object |

---

*For architecture details, see [`L2_L3_ARCHITECTURE.md`](./L2_L3_ARCHITECTURE.md).*  
*For MCP tool specifications, see [`MCP_TOOLS_SPECIFICATION.md`](./MCP_TOOLS_SPECIFICATION.md).*
