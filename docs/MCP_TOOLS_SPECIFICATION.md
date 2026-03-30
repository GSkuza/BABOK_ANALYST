> **Version:** 2.0 | **Status:** Draft | **Date:** 2026-03-30

# MCP Tools Specification — BABOK L2 Extensions

This document provides the complete technical specification for the five new MCP tools to be added to `babok-mcp/src/server.js` as part of the L2 architecture upgrade.

Architectural context: [`L2_L3_ARCHITECTURE.md`](./L2_L3_ARCHITECTURE.md)

---

## Table of Contents

1. [babok_create_jira_epic](#1-babok_create_jira_epic)
2. [babok_create_github_issues](#2-babok_create_github_issues)
3. [babok_read_external_context](#3-babok_read_external_context)
4. [babok_quality_check](#4-babok_quality_check)
5. [babok_sync_stage_artifact](#5-babok_sync_stage_artifact)
6. [Implementation Notes](#6-implementation-notes)

---

## 1. `babok_create_jira_epic`

### Description

Creates one or more Jira epics from a structured list of requirements produced by Stage 4 (Solution Requirements Definition). Each requirement in the input list generates a separate Jira epic with linked sub-tasks for individual acceptance criteria.

### Invoked By

**Stage4Agent** — after requirements are finalised and approved by QualityAuditAgent.

### Input JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BabokCreateJiraEpicInput",
  "type": "object",
  "required": ["project_key", "requirements"],
  "properties": {
    "project_key": {
      "type": "string",
      "description": "Jira project key (e.g. 'BABOK', 'INV')",
      "pattern": "^[A-Z][A-Z0-9_]+$"
    },
    "requirements": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["id", "title", "description", "priority"],
        "properties": {
          "id": {
            "type": "string",
            "description": "Requirement ID (e.g. 'FR-001')"
          },
          "title": {
            "type": "string",
            "maxLength": 255
          },
          "description": {
            "type": "string"
          },
          "priority": {
            "type": "string",
            "enum": ["must_have", "should_have", "could_have", "wont_have"]
          },
          "acceptance_criteria": {
            "type": "array",
            "items": { "type": "string" }
          },
          "labels": {
            "type": "array",
            "items": { "type": "string" }
          }
        }
      }
    },
    "epic_label_prefix": {
      "type": "string",
      "default": "BABOK-Stage4",
      "description": "Label applied to all created epics for easy filtering"
    },
    "dry_run": {
      "type": "boolean",
      "default": false,
      "description": "If true, validates input and returns what would be created without calling Jira API"
    }
  }
}
```

### Output JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BabokCreateJiraEpicOutput",
  "type": "object",
  "properties": {
    "created": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "requirement_id": { "type": "string" },
          "jira_key": { "type": "string", "description": "e.g. 'BABOK-42'" },
          "jira_url": { "type": "string", "format": "uri" },
          "status": { "type": "string", "enum": ["created", "skipped", "error"] },
          "error": { "type": "string" }
        }
      }
    },
    "summary": {
      "type": "object",
      "properties": {
        "total": { "type": "integer" },
        "created": { "type": "integer" },
        "skipped": { "type": "integer" },
        "errors": { "type": "integer" }
      }
    }
  }
}
```

### Example Call

**Request:**
```json
{
  "tool": "babok_create_jira_epic",
  "arguments": {
    "project_key": "INV",
    "requirements": [
      {
        "id": "FR-001",
        "title": "Invoice digitisation — OCR capture",
        "description": "System shall capture incoming supplier invoices via OCR with ≥95% field accuracy.",
        "priority": "must_have",
        "acceptance_criteria": [
          "OCR accuracy ≥95% on a test set of 100 invoices",
          "Failed captures flagged for manual review within 1 business day"
        ],
        "labels": ["finance", "automation"]
      }
    ],
    "epic_label_prefix": "BABOK-Stage4"
  }
}
```

**Response:**
```json
{
  "created": [
    {
      "requirement_id": "FR-001",
      "jira_key": "INV-112",
      "jira_url": "https://your-org.atlassian.net/browse/INV-112",
      "status": "created"
    }
  ],
  "summary": { "total": 1, "created": 1, "skipped": 0, "errors": 0 }
}
```

### Implementation Notes

- Requires `JIRA_BASE_URL`, `JIRA_USER`, and `JIRA_API_TOKEN` environment variables.
- The tool maps `must_have` → Jira priority `Highest`, `should_have` → `High`, `could_have` → `Medium`, `wont_have` → `Low`.
- If `dry_run: true`, the tool returns the same response shape with `status: "skipped"` on every item and no Jira API calls are made.
- Jira epic link field ID varies by instance; the tool should check available fields via `GET /rest/api/3/field` before creating the first epic.

---

## 2. `babok_create_github_issues`

### Description

Bulk-creates GitHub Issues from a Risk Register produced by Stage 7 (Risk Assessment). Each risk becomes one GitHub Issue with labels derived from severity and category.

### Invoked By

**Stage7Agent** — after the Risk Register is finalised and approved.

### Input JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BabokCreateGithubIssuesInput",
  "type": "object",
  "required": ["owner", "repo", "risks"],
  "properties": {
    "owner": {
      "type": "string",
      "description": "GitHub repository owner (user or organisation)"
    },
    "repo": {
      "type": "string",
      "description": "GitHub repository name"
    },
    "risks": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["id", "title", "description", "likelihood", "impact", "mitigation"],
        "properties": {
          "id": { "type": "string", "description": "Risk ID (e.g. 'R-001')" },
          "title": { "type": "string", "maxLength": 255 },
          "description": { "type": "string" },
          "likelihood": {
            "type": "string",
            "enum": ["low", "medium", "high", "critical"]
          },
          "impact": {
            "type": "string",
            "enum": ["low", "medium", "high", "critical"]
          },
          "mitigation": { "type": "string" },
          "owner": { "type": "string", "description": "GitHub username to assign, optional" },
          "category": {
            "type": "string",
            "enum": ["technical", "financial", "compliance", "operational", "strategic"]
          }
        }
      }
    },
    "label_prefix": {
      "type": "string",
      "default": "babok-risk",
      "description": "Prefix for auto-created labels"
    },
    "milestone": {
      "type": "string",
      "description": "Milestone title to attach all issues to (optional)"
    },
    "dry_run": {
      "type": "boolean",
      "default": false
    }
  }
}
```

### Output JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BabokCreateGithubIssuesOutput",
  "type": "object",
  "properties": {
    "created": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "risk_id": { "type": "string" },
          "issue_number": { "type": "integer" },
          "issue_url": { "type": "string", "format": "uri" },
          "status": { "type": "string", "enum": ["created", "skipped", "error"] },
          "error": { "type": "string" }
        }
      }
    },
    "summary": {
      "type": "object",
      "properties": {
        "total": { "type": "integer" },
        "created": { "type": "integer" },
        "skipped": { "type": "integer" },
        "errors": { "type": "integer" }
      }
    }
  }
}
```

### Example Call

**Request:**
```json
{
  "tool": "babok_create_github_issues",
  "arguments": {
    "owner": "acme-corp",
    "repo": "invoice-system",
    "risks": [
      {
        "id": "R-003",
        "title": "GDPR breach due to unencrypted invoice archive",
        "description": "If historical invoice files are migrated without encryption-at-rest, a breach could expose personal data.",
        "likelihood": "medium",
        "impact": "critical",
        "mitigation": "Enforce AES-256 encryption before migration. Add pre-migration encryption check in CI pipeline.",
        "category": "compliance"
      }
    ],
    "label_prefix": "babok-risk"
  }
}
```

**Response:**
```json
{
  "created": [
    {
      "risk_id": "R-003",
      "issue_number": 47,
      "issue_url": "https://github.com/acme-corp/invoice-system/issues/47",
      "status": "created"
    }
  ],
  "summary": { "total": 1, "created": 1, "skipped": 0, "errors": 0 }
}
```

### Implementation Notes

- Requires `GITHUB_TOKEN` environment variable with `repo` scope (or `public_repo` for public repos).
- Labels are auto-created if they do not exist (e.g. `babok-risk:compliance`, `babok-risk:critical`).
- Risk severity (derived from `likelihood × impact`) is mapped to GitHub label colour: `critical` → red `#d73a49`, `high` → orange `#e4e669`, `medium` → yellow `#f9d0c4`, `low` → green `#0075ca`.
- Issue body is generated from a Markdown template combining description and mitigation steps.

---

## 3. `babok_read_external_context`

### Description

Reads an external document (web URL or local file path) and returns a structured context object that can be injected into a stage agent's prompt. Supports HTML pages, plain text, Markdown, and PDF (text extraction).

### Invoked By

**Stage1Agent** and **Stage2Agent** — to ingest existing company documentation, process maps, or regulatory texts before running analysis.

### Input JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BabokReadExternalContextInput",
  "type": "object",
  "required": ["source"],
  "properties": {
    "source": {
      "type": "string",
      "description": "URL (https://...) or absolute local file path"
    },
    "source_type": {
      "type": "string",
      "enum": ["auto", "html", "markdown", "pdf", "text"],
      "default": "auto",
      "description": "Force source type; 'auto' detects from URL/file extension"
    },
    "extract_mode": {
      "type": "string",
      "enum": ["full", "summary", "headings_only"],
      "default": "full"
    },
    "max_chars": {
      "type": "integer",
      "default": 16000,
      "description": "Maximum characters to return (truncated from end if exceeded)"
    },
    "label": {
      "type": "string",
      "description": "Human-readable label for this context source (stored in context store)"
    }
  }
}
```

### Output JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BabokReadExternalContextOutput",
  "type": "object",
  "properties": {
    "label": { "type": "string" },
    "source": { "type": "string" },
    "source_type": { "type": "string" },
    "content": { "type": "string", "description": "Extracted text content" },
    "char_count": { "type": "integer" },
    "truncated": { "type": "boolean" },
    "metadata": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "author": { "type": "string" },
        "date": { "type": "string" },
        "word_count": { "type": "integer" }
      }
    },
    "error": { "type": "string" }
  }
}
```

### Example Call

**Request:**
```json
{
  "tool": "babok_read_external_context",
  "arguments": {
    "source": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679",
    "source_type": "html",
    "extract_mode": "summary",
    "max_chars": 8000,
    "label": "GDPR full text"
  }
}
```

**Response:**
```json
{
  "label": "GDPR full text",
  "source": "https://eur-lex.europa.eu/...",
  "source_type": "html",
  "content": "REGULATION (EU) 2016/679 OF THE EUROPEAN PARLIAMENT... [summary extracted]",
  "char_count": 7842,
  "truncated": false,
  "metadata": {
    "title": "GDPR — General Data Protection Regulation",
    "date": "2016-04-27"
  }
}
```

### Implementation Notes

- For `html` sources: use `fetch` + a lightweight HTML-to-text converter (e.g. `@mozilla/readability` or regex stripping).
- For `pdf` sources: use `pdf-parse` npm package. Return error if binary extraction fails.
- For local files: validate that the path is within the project directory (prevent path traversal).
- Extracted content is stored in `agent_messages` in the context store with type `external_context` so all agents can reference it.
- Respect `robots.txt` for web URLs when running in production environments.

---

## 4. `babok_quality_check`

### Description

Invokes the QualityAuditAgent for a specified BABOK stage. Reads the stage artefact from the context store, runs the scoring rubric, and returns a structured quality report. Used by the OrchestratorAgent to implement the L3 Autonomous Quality Loop.

### Invoked By

**OrchestratorAgent** — after every stage agent completes.

### Input JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BabokQualityCheckInput",
  "type": "object",
  "required": ["project_id", "stage"],
  "properties": {
    "project_id": {
      "type": "string",
      "description": "BABOK project ID (e.g. 'BABOK-20260330-XXXX')"
    },
    "stage": {
      "type": "string",
      "enum": ["stage1", "stage2", "stage3", "stage4", "stage5", "stage6", "stage7", "stage8"],
      "description": "Which stage to audit"
    },
    "artifact_path": {
      "type": "string",
      "description": "Override: explicit path to artefact file. If omitted, resolved from context store."
    },
    "iteration": {
      "type": "integer",
      "minimum": 1,
      "maximum": 3,
      "default": 1,
      "description": "Current iteration number (1–3)"
    },
    "prior_issues": {
      "type": "array",
      "description": "Issues from previous iteration to verify were resolved",
      "items": {
        "type": "object",
        "properties": {
          "severity": { "type": "string" },
          "section": { "type": "string" },
          "description": { "type": "string" }
        }
      }
    }
  }
}
```

### Output JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BabokQualityCheckOutput",
  "type": "object",
  "required": ["stage", "timestamp", "scores", "passed", "action"],
  "properties": {
    "stage": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" },
    "iteration": { "type": "integer" },
    "scores": {
      "type": "object",
      "required": ["completeness", "consistency", "quality", "overall"],
      "properties": {
        "completeness": { "type": "number", "minimum": 0, "maximum": 100 },
        "consistency": { "type": "number", "minimum": 0, "maximum": 100 },
        "quality": { "type": "number", "minimum": 0, "maximum": 100 },
        "overall": { "type": "number", "minimum": 0, "maximum": 100 }
      }
    },
    "passed": { "type": "boolean" },
    "issues": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["severity", "section", "description", "recommendation"],
        "properties": {
          "severity": { "type": "string", "enum": ["critical", "major", "minor"] },
          "section": { "type": "string" },
          "description": { "type": "string" },
          "recommendation": { "type": "string" }
        }
      }
    },
    "action": {
      "type": "string",
      "enum": ["approve", "iterate", "escalate_to_human"]
    },
    "prior_issues_resolved": {
      "type": "array",
      "description": "Which prior issues were resolved in this iteration",
      "items": { "type": "string" }
    }
  }
}
```

### Example Call

**Request:**
```json
{
  "tool": "babok_quality_check",
  "arguments": {
    "project_id": "BABOK-20260330-A1B2",
    "stage": "stage1",
    "iteration": 1
  }
}
```

**Response:**
```json
{
  "stage": "stage1",
  "timestamp": "2026-03-30T09:15:00Z",
  "iteration": 1,
  "scores": {
    "completeness": 88,
    "consistency": 92,
    "quality": 79,
    "overall": 86.9
  },
  "passed": true,
  "issues": [
    {
      "severity": "minor",
      "section": "Success Criteria",
      "description": "KPI 'document retrieval time' has no baseline measurement",
      "recommendation": "Add current baseline value with data source (e.g. 'Current avg: 12 minutes — Finance team survey Feb 2026')"
    }
  ],
  "action": "approve"
}
```

### Implementation Notes

- This tool is the bridge between the OrchestratorAgent and QualityAuditAgent system prompt.
- Internally: load artefact file → inject into QualityAuditAgent prompt with rubric from `quality_scoring_rubric.json` → parse LLM response as JSON → return structured output.
- Results are persisted to `quality_reports[stage]` in the project context store.
- If the LLM response cannot be parsed as valid JSON, the tool returns an error and treats it as iteration exhaustion (safe fallback → escalate_to_human).

---

## 5. `babok_sync_stage_artifact`

### Description

Exports a stage artefact (Markdown file) to an external knowledge base system (Confluence page or SharePoint document). Acts as a synchronisation stub — full implementations require tenant-specific credentials.

### Invoked By

**OrchestratorAgent** — after a stage is approved (quality_check passed) and human approval is received (if in L2 mode with human approval).

### Input JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BabokSyncStageArtifactInput",
  "type": "object",
  "required": ["project_id", "stage", "target"],
  "properties": {
    "project_id": {
      "type": "string"
    },
    "stage": {
      "type": "string",
      "enum": ["stage1", "stage2", "stage3", "stage4", "stage5", "stage6", "stage7", "stage8", "final"]
    },
    "target": {
      "type": "object",
      "required": ["system"],
      "properties": {
        "system": {
          "type": "string",
          "enum": ["confluence", "sharepoint", "local_copy"]
        },
        "confluence": {
          "type": "object",
          "properties": {
            "base_url": { "type": "string", "format": "uri" },
            "space_key": { "type": "string" },
            "parent_page_id": { "type": "string" },
            "page_title_prefix": { "type": "string", "default": "BABOK" }
          }
        },
        "sharepoint": {
          "type": "object",
          "properties": {
            "site_url": { "type": "string", "format": "uri" },
            "library": { "type": "string" },
            "folder_path": { "type": "string" }
          }
        },
        "local_copy": {
          "type": "object",
          "properties": {
            "destination_path": { "type": "string" }
          }
        }
      }
    },
    "overwrite_existing": {
      "type": "boolean",
      "default": true
    }
  }
}
```

### Output JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BabokSyncStageArtifactOutput",
  "type": "object",
  "properties": {
    "status": { "type": "string", "enum": ["synced", "skipped", "error"] },
    "destination_url": { "type": "string", "format": "uri" },
    "destination_path": { "type": "string" },
    "artifact_size_bytes": { "type": "integer" },
    "synced_at": { "type": "string", "format": "date-time" },
    "error": { "type": "string" }
  }
}
```

### Example Call

**Request:**
```json
{
  "tool": "babok_sync_stage_artifact",
  "arguments": {
    "project_id": "BABOK-20260330-A1B2",
    "stage": "stage4",
    "target": {
      "system": "confluence",
      "confluence": {
        "base_url": "https://acme.atlassian.net/wiki",
        "space_key": "BA",
        "parent_page_id": "123456",
        "page_title_prefix": "BABOK Invoice System"
      }
    }
  }
}
```

**Response:**
```json
{
  "status": "synced",
  "destination_url": "https://acme.atlassian.net/wiki/spaces/BA/pages/789012",
  "artifact_size_bytes": 14320,
  "synced_at": "2026-03-30T10:30:00Z"
}
```

### Implementation Notes

- **Confluence:** Requires `CONFLUENCE_BASE_URL`, `CONFLUENCE_USER`, `CONFLUENCE_API_TOKEN`. Uses Confluence REST API v2 (`PUT /wiki/rest/api/content/{id}` for updates, `POST` for creation).
- **SharePoint:** Requires `SHAREPOINT_TENANT_ID`, `SHAREPOINT_CLIENT_ID`, `SHAREPOINT_CLIENT_SECRET`. Uses Microsoft Graph API `PUT /sites/{siteId}/drives/{driveId}/root:/{filePath}:/content`.
- **local_copy:** Copies the artefact file to `destination_path` without any external API calls. Useful for testing and air-gapped environments.
- Markdown is converted to Confluence Storage Format (XHTML) using a lightweight transformer before upload.
- Stage-to-filename mapping uses the existing `STAGE_FILE_NAMES` constant from `babok-mcp/src/lib/project.js`.

---

## 6. Implementation Notes

### Adding Tools to `babok-mcp/src/server.js`

Each tool follows the existing pattern in `server.js`. Template:

```javascript
server.tool(
  'babok_create_jira_epic',
  'Creates Jira epics from Stage 4 requirements. Requires JIRA_BASE_URL, JIRA_USER, JIRA_API_TOKEN env vars.',
  {
    project_key: z.string().regex(/^[A-Z][A-Z0-9_]+$/),
    requirements: z.array(z.object({
      id: z.string(),
      title: z.string().max(255),
      description: z.string(),
      priority: z.enum(['must_have', 'should_have', 'could_have', 'wont_have']),
      acceptance_criteria: z.array(z.string()).optional(),
      labels: z.array(z.string()).optional(),
    })).min(1),
    epic_label_prefix: z.string().default('BABOK-Stage4'),
    dry_run: z.boolean().default(false),
  },
  async ({ project_key, requirements, epic_label_prefix, dry_run }) => {
    // implementation
  }
);
```

### Environment Variables Summary

| Variable | Required By | Description |
|----------|-------------|-------------|
| `JIRA_BASE_URL` | `babok_create_jira_epic` | e.g. `https://your-org.atlassian.net` |
| `JIRA_USER` | `babok_create_jira_epic` | Jira account email |
| `JIRA_API_TOKEN` | `babok_create_jira_epic` | Jira API token (not password) |
| `GITHUB_TOKEN` | `babok_create_github_issues` | GitHub personal access token (`repo` scope) |
| `CONFLUENCE_BASE_URL` | `babok_sync_stage_artifact` | e.g. `https://your-org.atlassian.net/wiki` |
| `CONFLUENCE_USER` | `babok_sync_stage_artifact` | Confluence account email |
| `CONFLUENCE_API_TOKEN` | `babok_sync_stage_artifact` | Confluence API token |

All variables are optional at server startup — tools return a descriptive error if a required variable is missing when the tool is called.

### Test File Location

Tests for the new tools should be added to `babok-mcp/src/test/` following the existing test structure. Use `dry_run: true` / mock credentials for CI.
