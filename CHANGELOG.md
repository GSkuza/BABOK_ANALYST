# Changelog

All notable changes to BABOK Analyst project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-03-16

### Added
- **MCP Server (`babok-mcp/`):** New standalone package exposing BABOK project management as a [Model Context Protocol](https://modelcontextprotocol.io) server. Claude, GPT-4o, and any MCP-compatible AI assistant can now create projects, load stage instructions, approve stages, search deliverables, and export results — without leaving the chat interface.
- **8 MCP Tools:** `babok_new_project`, `babok_list_projects`, `babok_get_stage`, `babok_approve_stage`, `babok_get_deliverable`, `babok_save_deliverable`, `babok_search`, `babok_export`.
- **9 MCP Resources:** All stage prompt files (Stages 0–8) exposed as `babok://stages/{n}` URIs — the AI reads the actual BABOK instructions before working on each stage.
- **Smoke test suite (`babok-mcp/src/test/smoke.js`):** 10 assertions covering ID generation, journal CRUD, approval flow, rejection, partial ID resolution, and deliverable I/O.
- **`BABOK_PROJECTS_DIR` and `BABOK_AGENT_DIR` env vars:** Configure where journals and stage prompts live — works standalone or nested inside the monorepo.

### Architecture
This release adds the `babok-mcp/` package as the second component alongside `cli/`. Both share the same project/journal data model (identical JSON format).

## [1.9.0] - 2026-03-16

### Added
- **Stage 0: Project Charter:** New pre-Stage 1 gate (`BABOK_agent_stage_0.md`) that captures business trigger, sponsor sign-off, and scope boundary in 15–30 minutes. New projects now start at Stage 0.
- **`babok diff` command:** Single-ID mode shows journal stage history with deliverable file preview. Two-ID mode runs an LCS-based line diff across stage deliverables with colored `+/-` output and configurable context (`--context N`).
- **Prompt Linter (`cli/scripts/lint-stages.js`):** Validates all 9 stage files (0–8) for required sections (`## Objectives`, `## Process`), unfilled placeholders, token estimate, and file existence. Exits non-zero on errors.
- **GitHub Actions CI (`.github/workflows/lint-prompts.yml`):** Automatically runs the stage linter on every push or PR that touches `BABOK_AGENT/stages/`.

### Changed
- **Stage validation range:** `babok approve` and `babok reject` now accept stage `0` through `8` (previously `1–8`).
- **Completion message:** "All 8 stages complete!" updated to "All stages complete!" to accommodate variable stage counts.
- **Journal initialization:** New projects include Stage 0 in their `stages` array with `current_stage: 0`.

## [1.8.2] - 2026-02-11

### Added
- **Automated Analysis Pipeline:** New `babok run` command with context-driven execution and optional auto-run mode.
- **Vertex AI Provider Support:** Added Google Vertex AI provider with project/region configuration and credential handling.
- **Copilot Prompt Library:** Added `.github/prompts/` with stage-specific and full-run prompt helpers.
- **Context Template:** Added `templates/project_context.example.json` to standardize run inputs.
- **User Manual (PL):** Added PDF user manual for distribution.

### Changed
- **Provider Picker:** Interactive prompt now supports model selection and stores provider-specific defaults.
- **Model Defaults:** Updated OpenAI and Hugging Face default models and available model lists.
- **Stage 1 Scope Questions:** Simplified initial scope questions to remove redundant document/process list.

### Fixed
- **Chat Initialization:** Await provider initialization in `babok chat` to prevent race conditions.

## [1.8.1] - 2026-02-08

### Fixed
- **Copilot Instructions Versioning:** Updated `.github/copilot-instructions.md` to correctly report version **1.8.1** and align with the 1.8.x release line.
- **Version Metadata Alignment:** Synchronized `VERSION`, CLI `package.json`, and top-level `README.md` footer to **1.8.1**.

## [1.8.0] - 2026-02-08

### Added
- **Sequential Question Protocol (Agent UX):** Agent now asks questions one-by-one with `Question X/Y` indicators, short "Answer recorded" confirmations, and step summaries before document generation.
- **Question Navigation Commands:** Added high-level commands `Next question`, `Previous question`, and `Skip questions` to control question flow.
- **CEO-ready DOCX/PDF Exports:** New CLI `babok make docx|pdf|all` commands to convert stage Markdown files into professionally formatted DOCX and PDF outputs.

### Changed
- **Documentation Updates:** Refined system prompts, Quick Start, Command Reference, and main README to document the sequential question protocol and new document export features.

## [1.7.0] - 2026-02-08

### Added
- **Bilingual Quick Start Commands:** New `begin` and `zacznij` commands as aliases for `babok new`, enabling instant project creation in English or Polish.
- **Enhanced CLI Entry Points:** Multiple command-line entry points for improved accessibility and user experience.

### Changed
- **LLM Management Enhancement:** Improved stability and error handling in LLM provider switching.
- **Project Management:** Enhanced project structure and journaling system for better reliability.

## [1.6.0] - 2026-02-08

### Added
- **Dynamic LLM Management:** New commands `babok llm list` and `babok llm change` to view and switch between 20+ supported models (Gemini 2.0, Claude 3.7, GPT-4o, DeepSeek).
- **In-Chat Model Switching:** Ability to swap AI providers or models mid-conversation using the new `/llm` command without losing history.
- **Bilingual Support (EN/PL):** Complete support for English and Polish languages across CLI and AI Agent.
- **Language Management Commands:** New commands `babok pl`, `babok eng`, and `babok lang` for global language switching.
- **Multilingual Journaling:** Project journals now store and respect language preference (EN/PL) throughout all 8 stages.
- **Localized UI:** Bilingual implementation of all CLI status messages, project creation outputs, and error handling.

### Fixed
- **Terminal Duplication Bug:** Resolved an issue where input characters and outputs were appearing twice in some terminal environments.
- **Project Discovery:** Improved smart path resolution for finding projects in shared workspaces or subdirectories.
- **Gemini API Format:** Fixed `system_instruction` structure for Google Gemini SDK.

### Changed
- **Optimized LLM Prompt:** Shortened the standalone system prompt by **92%** (from ~60k to 5,752 characters) for faster response times and significantly lower token consumption.
- **Improved AI Context:** Enhanced prompt template to explicitly instruct the agent on the target language for each project.

## [1.2.0] - 2026-02-08

### Added
- **Universal Regulatory Framework:** Replaced hardcoded Polish regulations with adaptive "Critical Regulatory Requirements" compatible with any jurisdiction (GDPR, SOX, ISO, etc.).
- **Command Line Interface (CLI):** 30+ terminal-style commands (e.g., `Launch analysis`, `Status`, `Deep analysis`, `Export all`) for power users.
- **Adaptive Model Selection:** Intelligent tiering (Deep Analysis vs. Standard vs. Rapid) based on task complexity.
- **Improved Usability:** `Batch questions`, `Workshop` mode, and `Async` operating modes.

### Changed
- **Start Command:** Updated from `BEGIN STAGE 1` to `Launch analysis`.
- **Documentation:** Unified system prompt structure across all files.

## [1.1.0] - 2026-02-07

### Changed
- **Reasoning Methodology:** Replaced Chain-of-Thought with **Short Rationale + Evidence** format
  - Reduces output verbosity by ~60%
  - Every conclusion now includes: statement, assumptions (max 3-5), evidence source
  - Internal reasoning process no longer exposed

- **Company Positioning:** Updated from "SME/MSP sector" to **"Mid-Market"** (€10-100M revenue, 50-500 employees)
  - Industry focus: Manufacturing, Distribution, Service Industries
  - Added EU/Polish regulatory focus (GDPR, KSeF, sector-specific)

### Added
- **Executive Summary (1 page)** added to all stage deliverable templates (Stages 1-4)
  - Key findings, critical decisions needed, business impact, approval requirements
  - Agent presents summary FIRST, then offers detailed analysis on request

- **Change Control Process** (new Section 9 in Stage 4)
  - Change Request template with impact analysis checklist
  - Change Approval Matrix (Cosmetic → Scope changes with appropriate authority)
  - Change Log, Requirements Versioning (semantic versioning), Baseline Freeze rules
  - Agent instructions: formal CR process for any changes after Stage 4 approval

- **RACI Matrix** added to Stage 1 (Stakeholder Mapping)
  - Responsibility assignment for 10 key project activities
  - Steering Committee structure, quorum rules, decision-making process
  - Escalation path with SLAs

- **DPIA (Data Protection Impact Assessment)** added as Stage 7 appendix
  - GDPR Article 35 compliance template
  - Processing activity description, necessity assessment
  - Risk matrix with mitigation measures
  - Data subject rights implementation plan

- **KSeF Technical Requirements Expansion** (FR-020 in Stage 4)
  - 9 detailed acceptance criteria (AC-020-01 through AC-020-09)
  - Normal flow, validation errors, retry logic, duplicate prevention
  - Monitoring dashboard, environment management (TEST/PROD)
  - Authentication, UPO storage, edge cases (corrections, multi-currency, prepaid)

- **Modeling Notation Standards** added to Stage 2 deliverable template
  - BPMN 2.0 for process flows, UML 2.5 for use cases
  - C4 Model for system architecture, VSM for value streams
  - Quality checklist for all diagrams
  - Stage 5 references same standards

### Reviewed By
- Expert peer review by Grzegorz Skuza (GTMO Framework Author, AI Safety Specialist)
- 8/8 changes accepted (100%)

---

## [1.0.0] - 2026-02-07

### Added
- **BABOK Agent System Prompt** - Main agent instructions implementing BABOK v3 framework
  - 8-stage analysis process (Project Initialization → Business Case & ROI)
  - Chain-of-Thought reasoning with human-in-the-loop validation
  - Specialized for IT projects in SME/MSP sector
  - Polish/English bilingual support
  - Comprehensive documentation templates for each stage
  
- **Quick Start Guide** - Step-by-step instructions for launching the agent
  - Method 1: Claude.ai (Projects)
  - Method 2: VS Code with Claude Code CLI
  - Method 3: VS Code with GitHub Copilot Chat
  - Method 4: ChatGPT or other LLMs
  - Method 5: API (Anthropic, OpenAI)
  
- **Project Structure Template** - Recommended folder organization
  - 8 main folders (01_Project_Charter → 08_Business_Case)
  - Subfolder templates for process maps, requirements, risk registers
  - File naming conventions
  - Sample deliverable descriptions
  
- **GitHub Copilot Integration** - Custom instructions for VS Code
  - Automatic loading of agent configuration
  - Optimized for Copilot Chat interface
  
- **Complete README** - Project documentation
  - Repository structure explanation
  - Installation and setup instructions
  - Multiple deployment methods
  - Best practices and troubleshooting
  - Security and privacy guidelines
  
- **Example Analysis Folder** - Template structure for real projects
  - BABOK_ANALYSIS_System_Potencjalow_02_2026/
  - Complete directory tree with 8 stage folders
  - Ready-to-use structure for document management analysis

### Documentation
- Comprehensive README with 8 deployment methods
- Estimated timeline: 3-4 weeks for complete analysis (8-12 hours with agent)
- Troubleshooting section for common issues
- Communication format and control commands reference

### Technical
- `.gitignore` configured to exclude local analysis files
- Repository structure optimized for GitHub
- Support for Windows, macOS, Linux

### Standards & Compliance
- BABOK v3 (International Institute of Business Analysis) compliant
- GDPR privacy considerations built-in
- ISO 27001 security principles
- Polish regulatory requirements (KSeF, JPK_V7M, RODO)

---

## [Unreleased]

### Planned Features
- Interactive web interface for agent interaction
- Pre-built templates for common industries (retail, manufacturing, services)
- Integration with project management tools (Jira, Azure DevOps)
- Multi-language support (German, French, Spanish)
- Video tutorials for each stage
- Sample completed analyses (anonymized)

---

## Version History

- **1.1.0** (2026-02-07) - Short Rationale methodology, Executive Summaries, Change Control, RACI, DPIA, KSeF expansion, Modeling Standards
- **1.0.0** (2026-02-07) - Initial public release
