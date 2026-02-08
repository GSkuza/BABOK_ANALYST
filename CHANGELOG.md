# Changelog

All notable changes to BABOK Analyst project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-02-08

### Added
- **Bilingual Support (EN/PL):** Complete support for English and Polish languages across CLI and AI Agent.
- **Language Management Commands:** New commands `babok pl`, `babok eng`, and `babok lang` for global language switching.
- **Multilingual Journaling:** Project journals now store and respect language preference (EN/PL) throughout all 8 stages.
- **Localized UI:** Bilingual implementation of all CLI status messages, project creation outputs, and error handling.

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
