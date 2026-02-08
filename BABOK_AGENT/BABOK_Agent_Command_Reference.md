# BABOK Agent v1.8 - Command Reference Card

## 🚀 QUICK START

```bash
Launch analysis    # Start new BABOK analysis (Stage 1)
Status            # Check progress across all stages
Help              # Show all available commands
```

---

## 📋 SESSION CONTROL

| Command | Description | Example |
|---------|-------------|---------|
| `Launch analysis` | Start new BABOK analysis from Stage 1 | `Launch analysis` |
| `Resume [N]` | Resume from specific stage | `Resume 3` |
| `Pause` | Save current state and exit | `Pause` |
| `Status` | Show progress across all 8 stages | `Status` |
| `Reset` | Clear all data, start fresh (requires confirmation) | `Reset` |
| `Version` | Show agent version and capabilities | `Version` |
| `Next question` | Skip current question and go to the next one | `Next question` |
| `Previous question` | Go back to previous question (within the same step) | `Previous question` |
| `Skip questions` | Show all remaining questions in current step at once (batch mode) | `Skip questions` |

---

## ✅ STAGE MANAGEMENT

| Command | Description | Example |
|---------|-------------|---------|
| `Approve [N]` | Approve stage and proceed to next | `Approve 1` |
| `Reject [N] [reason]` | Reject stage with explanation | `Reject 2 missing baseline data` |
| `Skip to [N]` | Jump to stage (shows warning) | `Skip to 4` |
| `Regenerate [N]` | Rebuild stage from scratch | `Regenerate 3` |
| `Validate [N]` | Check stage completeness before approval | `Validate 1` |

---

## 📄 DOCUMENT OPERATIONS

| Command | Description | Example |
|---------|-------------|---------|
| `Export [N]` | Export single stage deliverable (markdown) | `Export 1` |
| `Export all` | Export all completed stages (markdown) | `Export all` |
| `Summary [N]` | Show executive summary only (1 page) | `Summary 2` |
| `Detail [N]` | Show full detailed analysis | `Detail 2` |
| `Preview [N]` | Preview what will be generated | `Preview 3` |
| `Template [type]` | Show empty template | `Template stakeholder_register` |
| `MAKE DOCX` | (CLI) Generate professional DOCX files from stage .md | `babok make docx BABOK-20260208-XXXX` |
| `MAKE PDF` | (CLI) Generate executive-style PDFs from stage .md | `babok make pdf BABOK-20260208-XXXX` |
| `MAKE ALL` | (CLI) Generate both DOCX and PDF in one run | `babok make all BABOK-20260208-XXXX` |

---

## 🔍 DATA MANAGEMENT

| Command | Description | Example |
|---------|-------------|---------|
| `Show assumptions` | List all current assumptions | `Show assumptions` |
| `Show decisions` | List all decisions made | `Show decisions` |
| `Show risks` | List all identified risks | `Show risks` |
| `Show requirements` | List all requirements (Stage 4+) | `Show requirements` |
| `Update [item_id]` | Modify specific item | `Update ASM-003` |

---

## 🧠 ANALYSIS CONTROL

| Command | Description | Model Used | Example |
|---------|-------------|------------|---------|
| `Deep analysis [topic]` | Activate Gemini Pro 3 / Opus 4.6 for complex reasoning | **Premium** | `Deep analysis vendor_selection` |
| `Quick check [query]` | Use Gemini Flash for simple queries | **Fast** | `Quick check invoice_volume` |
| `Compare [A] [B]` | Deep analysis comparing two options | **Premium** | `Compare cloud on-premise` |
| `Calculate ROI [scenario]` | Financial modeling for business case | **Premium** | `Calculate ROI full_automation` |

**Model Tiers:**
- **Premium (Deep Analysis):** Gemini Pro 3 / Claude Opus 4.6 - Complex reasoning, critical decisions
- **Standard:** Default model - Most analytical work
- **Fast (Rapid Mode):** Gemini Flash - Data retrieval, formatting, simple queries

---

## 👥 COLLABORATION

| Command | Description | Example |
|---------|-------------|---------|
| `Question [topic]` | Ask human for clarification | `Question baseline_metrics` |
| `Batch questions` | Queue all pending questions for one-time response | `Batch questions` |
| `Workshop [N]` | Interactive mode with frequent human input | `Workshop 4` |
| `Async [N]` | Autonomous mode with minimal interruptions | `Async 2` |

---

## 🆘 HELP & UTILITIES

| Command | Description | Example |
|---------|-------------|---------|
| `Help` | Show all available commands | `Help` |
| `Help [command]` | Detailed help for specific command | `Help Deep analysis` |
| `Version` | Show agent version, framework, capabilities | `Version` |

---

## 🔥 COMMON WORKFLOWS

### Starting a New Project (with Sequential Questions):
```bash
1. Launch analysis          # Initialize Stage 1
2. [Answer questions]       # Provide project context
3. Summary 1                # Review executive summary
4. Approve 1                # Finalize Stage 1
5. Status                   # Check progress
6. [Repeat for stages 2-8]
```

From v1.4 onwards, within each stage the agent:
- asks questions **one-by-one** with progress indicator (e.g. `Question 1/5`, `Question 2/5`),
- confirms each answer (`✅ Answer recorded: [...]`) before the next question,
- shows a **summary of all answers** before generating the stage deliverable.

Use `Next question`, `Previous question` or `Skip questions` to control the flow if needed.

### Reviewing Progress:
```bash
Status                      # See all stages at a glance
Summary 2                   # Quick review of specific stage
Detail 2                    # Deep dive if needed
```

### Making a Critical Decision:
```bash
Deep analysis vendor_selection
# Agent activates Gemini Pro 3 / Opus 4.6
# Provides comprehensive multi-factor analysis
Compare option_a option_b
# Side-by-side comparison with trade-offs
```

### Exporting Deliverables:
```bash
Validate 4                  # Check Stage 4 completeness
Approve 4                   # Finalize
Export all                  # Get all completed stages
```

### Handling Changes:
```bash
Show requirements           # List all current requirements
Update FR-015               # Modify specific requirement
Regenerate 4                # Rebuild with changes
```

---

## 📊 STATUS INDICATORS

When you run `Status`, you'll see:

| Icon | Meaning |
|------|---------|
| ✅ | Stage completed and approved |
| 🔄 | Stage in progress (partial completion) |
| ⏸️ | Stage not started |
| ⚠️ | Stage has warnings or issues |
| ❌ | Stage rejected (needs revision) |

**Example Output:**
```
Stage 1: ✅ APPROVED (2025-02-07)
Stage 2: ✅ APPROVED (2025-02-14)
Stage 3: 🔄 IN PROGRESS (60% complete)
Stage 4: ⏸️ NOT STARTED
Stage 5: ⏸️ NOT STARTED
Stage 6: ⏸️ NOT STARTED
Stage 7: ⏸️ NOT STARTED
Stage 8: ⏸️ NOT STARTED
```

---

## 💡 PRO TIPS

### Tip 1: Use `Batch questions` for Efficiency
Instead of answering questions one-by-one:
```bash
Batch questions
# Agent queues all questions
# You answer all at once
# Faster workflow, less context switching
```

### Tip 2: `Summary` Before `Approve`
Always review executive summary before approving:
```bash
Summary 3                   # Quick 1-page review
# If looks good:
Approve 3
# If needs changes:
Reject 3 [reason]
```

### Tip 3: `Deep analysis` for Complex Decisions
Don't use premium models for everything. Save them for:
- Vendor selection
- Technology architecture choices
- ROI modeling
- Complex requirement conflicts

```bash
# NOT THIS:
Deep analysis what_is_gdpr         # Use Quick check instead

# THIS:
Deep analysis vendor_tradeoffs     # Good use of premium model
```

### Tip 4: `Export all` Regularly
Don't wait until the end. Export periodically:
```bash
# After each stage approval:
Approve 2
Export all                  # Backup in case of issues
```

### Tip 5: `Workshop` vs `Async` Mode
**Workshop Mode:** Use for Stage 4 (Requirements) - lots of stakeholder input needed
**Async Mode:** Use for Stage 2 (Current State) - agent can analyze data independently

```bash
Workshop 4                  # Requirements gathering
Async 2                     # Process documentation
```

---

## 🎯 KEYBOARD SHORTCUTS (if implemented in UI)

| Shortcut | Command |
|----------|---------|
| `Ctrl+S` | `Status` |
| `Ctrl+A` | `Approve [current_stage]` |
| `Ctrl+E` | `Export [current_stage]` |
| `Ctrl+H` | `Help` |
| `Ctrl+Q` | `Pause` |

---

## 🔧 TROUBLESHOOTING

### Issue: Agent not responding to command
**Solution:** Check command syntax. Commands are case-insensitive but spelling matters.
```bash
# ❌ Wrong:
Launche analysis
# ✅ Correct:
Launch analysis
```

### Issue: Stage approval fails
**Solution:** Run `Validate [N]` first to see what's missing.
```bash
Validate 1
# Agent shows: "Missing: Baseline metrics, Stakeholder contact info"
# Provide missing data, then:
Approve 1
```

### Issue: Want to change something after approval
**Solution:** Use `Regenerate` and update the section.
```bash
Regenerate 1
Update [section_name]
Approve 1
```

### Issue: Forgot where I left off
**Solution:**
```bash
Status                      # See current progress
Resume [last_stage]         # Continue from there
```

---

## 📞 GETTING HELP

**In-Agent Help:**
```bash
Help                        # All commands
Help [command]              # Specific command details
```

**Documentation:**
- System Prompt: `BABOK_Agent_System_Prompt.md`
- Quick Start Guide: `BABOK_Agent_Quick_Start_Guide.md`
- Command Reference: `BABOK_Agent_Command_Reference.md`
- Project Structure Template: `BABOK_Project_Structure_Template.md`

**Common Questions:**
- "What stage am I on?" → `Status`
- "What do I need to complete this stage?" → `Validate [N]`
- "Can I see what I've decided so far?" → `Show decisions`
- "How do I save my work?" → `Export all` (automatic saves also occur on `Approve`)

---

## 🎓 COMMAND MASTERY CHECKLIST

**Beginner (Day 1):**
- [ ] `Launch analysis`
- [ ] `Status`
- [ ] `Summary [N]`
- [ ] `Approve [N]`
- [ ] `Export all`

**Intermediate (Week 1):**
- [ ] `Deep analysis [topic]`
- [ ] `Compare [A] [B]`
- [ ] `Show requirements`
- [ ] `Validate [N]`
- [ ] `Batch questions`

**Advanced (Month 1):**
- [ ] `Workshop [N]` vs `Async [N]` strategically
- [ ] `Update [item_id]` for precise changes
- [ ] `Regenerate [N]` efficiently
- [ ] `Calculate ROI [scenario]` for financial modeling
- [ ] Custom workflows combining multiple commands

---

## 📋 PRINTABLE CHEAT SHEET

```
┌─────────────────────────────────────────────────────────┐
│         BABOK AGENT v1.8 - COMMAND CHEAT SHEET         │
├─────────────────────────────────────────────────────────┤
│ START:       Launch analysis                           │
│ STATUS:      Status                                    │
│ APPROVE:     Approve [N]                               │
│ EXPORT MD:   Export all                                │
│ MAKE DOCX:   babok make docx <project_id>              │
│ MAKE PDF:    babok make pdf <project_id>               │
│ HELP:        Help                                      │
├─────────────────────────────────────────────────────────┤
│ DEEP ANALYSIS:  Deep analysis [topic]                  │
│ QUICK CHECK:    Quick check [query]                    │
│ COMPARE:        Compare [A] [B]                        │
│ CALCULATE:      Calculate ROI [scenario]               │
├─────────────────────────────────────────────────────────┤
│ SHOW DATA:    Show assumptions / decisions / risks     │
│ UPDATE:       Update [item_id]                         │
│ VALIDATE:     Validate [N]                             │
├─────────────────────────────────────────────────────────┤
│ MODES:        Workshop [N] | Async [N]                 │
│ QUESTIONS:    Question [topic] | Batch questions       │
│ SEQUENTIAL:   Next question / Previous question        │
│ BATCH MODE:   Skip questions                           │
└─────────────────────────────────────────────────────────┘
```

---

**Version:** 1.8  
**Last Updated:** 2026-02-08  
**Framework:** BABOK® v3  
**License:** Proprietary

---

**Print this card and keep it handy for quick reference during your BABOK analysis project!**
