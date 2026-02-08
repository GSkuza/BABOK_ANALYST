# BABOK Analyst - AI-Powered Business Analysis Agent

An AI agent for professional business analysis compliant with **BABOK v3** (International Institute of Business Analysis) standard. Guides the analyst step-by-step through 8 stages - from project initialization to business case with ROI calculation.

## What is BABOK Analyst?

BABOK Analyst is a set of system prompts for AI models (Claude, ChatGPT, other LLMs) that transforms them into business analysis experts. The agent:

- Conducts a structured analysis process in **8 stages** (Stage 1-8)
- Uses **Short Rationale + Evidence** methodology (concise conclusions with cited evidence)
- Requires **human approval** at each stage (human-in-the-loop)
- Generates complete **project documentation** in Markdown format
- Manages **project lifecycle** with unique Project IDs, save/load, and persistent journal logs
- Specializes in IT projects for **mid-market** companies (€10-100M revenue, 50-500 employees)

## Repository Structure

```
BABOK_ANALYST/
|
|-- BABOK_AGENT/                          # Agent files
|   |-- BABOK_Agent_System_Prompt.md      # Main system prompt (modular, references stage files)
|   |-- BABOK_Agent_Quick_Start_Guide.md  # Quick start guide
|   |-- BABOK_Project_Structure_Template.md # Generic project folder structure template
|   |-- stages/                           # Individual stage instruction files
|   |   |-- BABOK_agent_stage_1.md        # Stage 1: Project Initialization
|   |   |-- BABOK_agent_stage_2.md        # Stage 2: Current State Analysis
|   |   |-- BABOK_agent_stage_3.md        # Stage 3: Problem Domain Analysis
|   |   |-- BABOK_agent_stage_4.md        # Stage 4: Solution Requirements
|   |   |-- BABOK_agent_stage_5.md        # Stage 5: Future State Design
|   |   |-- BABOK_agent_stage_6.md        # Stage 6: Gap Analysis & Roadmap
|   |   |-- BABOK_agent_stage_7.md        # Stage 7: Risk Assessment
|   |   |-- BABOK_agent_stage_8.md        # Stage 8: Business Case & ROI
|   |-- LLM_BABOK_AGENT/                  # Standalone prompt for LLM chat
|   |   |-- BABOK_Agent_LLM_Prompt.md     # Self-contained prompt (all stages inline)
|
|-- cli/                                  # Node.js CLI tool
|   |-- bin/babok.js                      # CLI entry point
|   |-- src/commands/                     # Command implementations
|   |-- src/journal.js                    # Project journal management
|   |-- src/project.js                    # Project ID generation
|   |-- src/display.js                    # Terminal output formatting
|   |-- package.json                      # npm package configuration
|   |-- README.md                         # CLI Quick Start Guide
|
|-- .github/
|   |-- copilot-instructions.md           # Configuration for GitHub Copilot / VS Code
|
|-- .gitignore                            # Excludes local analysis files
|-- README.md                             # This file
```

## 8 Analysis Stages

| Stage | Name | What You Get |
|------|-------|----------------|
| **Stage 1** | Project Initialization & Stakeholder Mapping | Project scope, stakeholder register, success criteria |
| **Stage 2** | Current State Analysis (AS-IS) | Process maps, cost baseline, system analysis |
| **Stage 3** | Problem Domain Analysis | Problem categorization, root cause analysis, prioritization |
| **Stage 4** | Solution Requirements Definition | Functional/non-functional requirements, user stories, MoSCoW |
| **Stage 5** | Future State Design (TO-BE) | Target architecture, TO-BE processes |
| **Stage 6** | Gap Analysis & Implementation Roadmap | Gap analysis, implementation roadmap |
| **Stage 7** | Risk Assessment & Mitigation Strategy | Risk register, mitigation plans |
| **Stage 8** | Business Case & ROI Model | Financial model, ROI, NPV, payback period |

---

## Modular Architecture (v1.4)

The agent system uses a **modular architecture** where each analysis stage has its own detailed instruction file:

```
BABOK_AGENT/
|-- BABOK_Agent_System_Prompt.md          # Core prompt (references stage files)
|-- stages/
|   |-- BABOK_agent_stage_1.md            # Detailed Stage 1 instructions
|   |-- BABOK_agent_stage_2.md            # Detailed Stage 2 instructions
|   |-- ...                               # Stages 3-7
|   |-- BABOK_agent_stage_8.md            # Detailed Stage 8 instructions
|-- LLM_BABOK_AGENT/
|   |-- BABOK_Agent_LLM_Prompt.md         # All-in-one prompt for LLM chat windows
```

**Two usage variants:**

| Variant | File | Use When |
|---------|------|----------|
| **Modular** | `BABOK_Agent_System_Prompt.md` + `stages/*.md` | VS Code, Claude Code, IDE-based workflows (agent can load stage files as needed) |
| **Standalone** | `LLM_BABOK_AGENT/BABOK_Agent_LLM_Prompt.md` | Direct paste into LLM chat (Claude.ai, ChatGPT, etc.) — all stages inline, self-contained |

Each stage file contains: step-by-step process, questions for human, deliverable template, quality checklist, and CLI command references.

---

## How to Get Started - Step by Step

### Method 1: Claude.ai (Projects)

1. **Clone or download the repository** (see section below)
2. Go to [claude.ai](https://claude.ai) and create a new **Project**
3. In project settings, click **"Project Instructions"** (Custom Instructions)
4. Copy the **entire** content of `BABOK_AGENT/LLM_BABOK_AGENT/BABOK_Agent_LLM_Prompt.md` file and paste it into the Project Instructions field
5. Start a new conversation in the project and type:
   ```
   BEGIN NEW PROJECT
   ```

### Method 2: VS Code with Claude Code (CLI)

1. Clone the repository:
   ```bash
   git clone https://github.com/GSkuza/BABOK_ANALYST.git
   cd BABOK_ANALYST
   ```
2. Install [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (requires Node.js 18+):
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```
3. Launch Claude Code in the project directory:
   ```bash
   claude
   ```
4. Claude will automatically load the configuration from `.github/copilot-instructions.md`
5. Type:
   ```
   BEGIN NEW PROJECT
   ```

### Method 3: VS Code with GitHub Copilot Chat

1. Clone the repository and open in VS Code:
   ```bash
   git clone https://github.com/GSkuza/BABOK_ANALYST.git
   code BABOK_ANALYST
   ```
2. Make sure you have the **GitHub Copilot Chat** extension installed
3. Copilot will automatically load instructions from `.github/copilot-instructions.md`
4. Open Copilot Chat (Ctrl+Shift+I) and type:
   ```
   BEGIN NEW PROJECT
   ```

### Method 4: ChatGPT or other LLM

1. Download the content of `BABOK_AGENT/LLM_BABOK_AGENT/BABOK_Agent_LLM_Prompt.md` file
2. In ChatGPT: Settings -> "Custom Instructions" or "System Prompt"
3. Paste the file content as system instructions
4. Start a new conversation and type:
   ```
   BEGIN NEW PROJECT
   ```

### Method 5: API (Anthropic, OpenAI, others)

Use the content of `BABOK_Agent_LLM_Prompt.md` as the `system` parameter in the API call:

```python
import anthropic

client = anthropic.Anthropic()

with open("BABOK_AGENT/LLM_BABOK_AGENT/BABOK_Agent_LLM_Prompt.md") as f:
    system_prompt = f.read()

message = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=8192,
    system=system_prompt,
    messages=[{"role": "user", "content": "BEGIN NEW PROJECT"}]
)
```

---

## BABOK CLI Tool

The repository includes a **cross-platform CLI tool** for managing project lifecycle directly from the terminal. The CLI handles project creation, state tracking via journal files, and stage management — independently of any specific AI platform.

### Installation

Requires **Node.js 18+**.

```bash
git clone https://github.com/GSkuza/BABOK_ANALYST.git
cd BABOK_ANALYST/cli
npm install
npm link        # Makes 'babok' command available globally
```

### CLI Commands

| Command | Description |
|---------|-------------|
| `babok new [--name "Name"]` | Create a new project with unique ID and timestamp |
| `babok list` | List all projects with current status |
| `babok status [id]` | Show detailed project status (all stages) |
| `babok load <id>` | Load project context (generates text to paste into AI chat) |
| `babok save <id>` | Save current project state snapshot |
| `babok approve <id> <stage>` | Mark a stage as approved, advance to next |
| `babok reject <id> <stage> -r "reason"` | Reject a stage with reason |
| `babok export <id>` | Export project deliverables to output directory |

### Quick Example

```bash
# Create a new project
babok new --name "ERP Integration"
# Output: Project ID: BABOK-20260208-K7M3

# Check all projects
babok list

# Approve Stage 1 after completing it in AI chat
babok approve K7M3 1

# View detailed status
babok status K7M3

# Load context for AI chat (copy & paste the output)
babok load K7M3

# Export deliverables when done
babok export K7M3
```

Partial IDs work — `babok status K7M3` matches `BABOK-20260208-K7M3`.

For the full CLI guide, see: [`cli/README.md`](cli/README.md)

---

## Cloning the Repository

### Requirements

- **Git** installed on your computer ([installation guide](https://git-scm.com/downloads))
- Optional: **VS Code** or other code editor

### Cloning via HTTPS

```bash
git clone https://github.com/GSkuza/BABOK_ANALYST.git
```

### Cloning via SSH

```bash
git clone git@github.com:GSkuza/BABOK_ANALYST.git
```

### Cloning via GitHub CLI

```bash
gh repo clone GSkuza/BABOK_ANALYST
```

### Download ZIP (without Git)

1. Go to https://github.com/GSkuza/BABOK_ANALYST
2. Click the green **"Code"** button
3. Select **"Download ZIP"**
4. Extract the archive to your chosen location

---

## How to Work with the Agent

### Communication Format

The agent asks questions in a structured format:

```
RATIONALE: [Concise conclusion with key assumptions]
EVIDENCE: [Data source: Stage N, stakeholder input, industry standard]

QUESTIONS FOR HUMAN:
1. [Question 1]
2. [Question 2]
...

WAIT FOR HUMAN INPUT.
```

### How to Respond

Respond specifically, using question numbering:

```
1. YES - all documents in scope: invoices, delivery notes, orders
2. ERP: SAP Business One v10.0
3. Accounting: Comarch ERP Optima v2024.1
4. We don't currently have a DMS
5. KSeF deadline: July 1, 2026
```

If you don't know something:

```
I DON'T KNOW - I need to check with [person/department]
```

### Control Commands

| Command | Action |
|---------|--------|
| `BEGIN NEW PROJECT` | Start a new project with unique ID and timestamp |
| `SAVE PROJECT` | Save project state (available after completing a stage) |
| `LOAD PROJECT [project_id]` | Resume a saved project at the last active stage |
| `Approve [N]` | Approve stage N and proceed to next |
| `Reject [N] [reason]` | Reject stage N with reason |
| `Status` | Display progress of all stages for current project |
| `Pause` | Pause current session (auto-saves to journal) |
| `Export all` | Export all completed stage deliverables |
| `Deep analysis [topic]` | Activate deep reasoning for critical decisions |
| `Help` | Show all available commands |

---

## Output Files

Each project gets its own directory identified by a unique **Project ID** (e.g., `BABOK-20260208-M3R1`). The agent generates Markdown documents for each stage plus a persistent journal log:

```
BABOK_Analysis/
└── BABOK-20260208-M3R1/                    # Project directory (unique per project)
    ├── PROJECT_JOURNAL_BABOK-20260208-M3R1.json  # State tracking journal
    ├── STAGE_01_Project_Initialization.md
    ├── STAGE_02_Current_State_Analysis.md
    ├── STAGE_03_Problem_Domain_Analysis.md
    ├── STAGE_04_Solution_Requirements.md
    ├── STAGE_05_Future_State_Design.md
    ├── STAGE_06_Gap_Analysis_Roadmap.md
    ├── STAGE_07_Risk_Assessment.md
    ├── STAGE_08_Business_Case_ROI.md
    └── FINAL_Complete_Documentation.md
```

The **Project Journal** (`PROJECT_JOURNAL_*.json`) tracks all stage transitions, approvals, decisions, and assumptions — enabling exact state restoration with `LOAD PROJECT`.

The recommended project folder structure is described in the `BABOK_AGENT/BABOK_Project_Structure_Template.md` file.

---

## Estimated Timeline

| Stage | Work with Agent | Internal Consultations | Total |
|------|----------------|----------------------|-------|
| Stage 1 | 30-45 min | 1-2 days | 1-2 days |
| Stage 2 | 1-2 hours | 3-5 days | ~1 week |
| Stage 3 | 45-60 min | 1-2 days | 2-3 days |
| Stage 4 | 2-3 hours | 3-5 days | ~1 week |
| Stage 5 | 1-2 hours | 2-3 days | 3-4 days |
| Stage 6 | 1 hour | 1 day | 1-2 days |
| Stage 7 | 45 min | 1 day | 1-2 days |
| Stage 8 | 1-2 hours | 2-3 days | 3-5 days |
| **TOTAL** | **8-12 hours** | **2-3 weeks** | **3-4 weeks** |

Most of the time is not spent working with the agent, but gathering data from stakeholders and internal consultations.

---

## Best Practices

**Do:**
- Read RATIONALE + EVIDENCE sections - you'll understand the agent's logic
- Be specific - "average 50 invoices/month" instead of "a lot"
- Approve sections progressively - you don't have to wait for the entire stage
- Correct immediately if the agent makes an error

**Don't:**
- Don't guess - say "I DON'T KNOW" if you don't know the answer
- Don't skip questions - each one has a justification
- Don't approve documents without reading them
- Don't mix stages - complete one before moving to the next

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Agent doesn't understand response | Rephrase more specifically, provide example |
| Agent asks about something you don't know | Respond "I DON'T KNOW" or mark as OPEN QUESTION |
| Error in earlier response | `CORRECTION in [Section X.Y]: [error description and fix]` |
| Document too technical | "Simplify section [X] for non-technical audience" |
| Change requirement priority | "Change requirement FR-015 from MUST to SHOULD. Reasoning: [...]" |

---

## Security and Privacy

**Agent DOES NOT store:** passwords, API keys, bank account numbers, personal data (except roles).

**Agent MAY store:** organizational structure, business processes, aggregated metrics, system names.

The agent is designed in compliance with GDPR, BABOK Code of Conduct, and ISO 27001 principles.

---

## Additional Resources

- [IIBA BABOK Guide v3](https://www.iiba.org/babok-guide/)
- [IIBA Agile Extension](https://www.iiba.org/agile-extension/)
- [BABOK Glossary](https://www.iiba.org/babok-guide/glossary/)

---

## License

This project is publicly available. Agent files can be used in any business analysis projects.

---

## Contributing

Contributions are welcome! Please feel free to submit:
- Bug reports and feature requests via GitHub Issues
- Pull requests for documentation improvements
- Sample analysis templates (anonymized)
- Translations to other languages

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

BABOK® is a registered trademark of the International Institute of Business Analysis (IIBA®).
This project is not officially endorsed by IIBA.

---

## Author

**Grzegorz Skuza**
- GitHub: [@GSkuza](https://github.com/GSkuza)
- Repository: [BABOK_ANALYST](https://github.com/GSkuza/BABOK_ANALYST)

---

**Version:** 1.4.0
**Release Date:** February 8, 2026
**Last Updated:** 2026-02-08
