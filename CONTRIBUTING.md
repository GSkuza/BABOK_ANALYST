# Contributing to BABOK Analyst

Thank you for your interest in contributing to BABOK Analyst! This document provides guidelines for contributing to the project.

## 🎯 Ways to Contribute

### 1. Report Bugs
- Use GitHub Issues to report bugs
- Include detailed description of the problem
- Provide steps to reproduce
- Mention your environment (OS, LLM platform, version)

**Issue Template for Bugs:**
```
Title: [BUG] Brief description

**Description:**
Clear description of what went wrong

**Steps to Reproduce:**
1. Step one
2. Step two
3. Expected vs Actual result

**Environment:**
- OS: Windows 11 / macOS / Linux
- Platform: Claude.ai / VS Code / API
- Agent Version: 1.0.0

**Screenshots/Logs:**
[If applicable]
```

### 2. Suggest Features
- Open an issue with `[Feature Request]` prefix
- Describe the use case and benefit
- Consider if it aligns with BABOK v3 principles

**Issue Template for Features:**
```
Title: [Feature Request] Brief description

**Problem Statement:**
What problem does this solve?

**Proposed Solution:**
What would you like to see?

**Alternatives Considered:**
Other approaches you've thought about

**BABOK Alignment:**
How does this relate to BABOK framework?
```

### 3. Improve Documentation
- Fix typos, clarify explanations
- Add examples or use cases
- Translate to other languages
- Create video tutorials (with permission)

### 4. Share Templates
- Anonymized completed analyses
- Industry-specific templates
- Integration examples

### 5. Contribute Code
- Improve agent prompts
- Add utility scripts
- Create integrations

---

## 📝 Contribution Guidelines

### Before You Start
1. **Check existing issues** - Someone might be working on it
2. **Open an issue first** - Discuss major changes before implementing
3. **Follow style guide** - Match existing documentation format

### For Documentation Changes

#### Style Guide
- Use clear, professional language
- Keep sentences concise
- Use Markdown formatting consistently
- Include examples where helpful
- Maintain bilingual support (Polish/English) where applicable

#### Documentation Structure
```markdown
# Title (H1 - Only one per document)

Brief introduction paragraph.

## Section (H2)

Content with examples.

### Subsection (H3)

Details.

#### Sub-subsection (H4)

Specific information.
```

#### Code Blocks
- Use appropriate language tags (`bash`, `python`, `json`, etc.)
- Include comments for complex examples
- Test all code snippets before submitting

### For Agent Prompt Changes

#### Critical Principles
1. **No Hallucinations** - Always ask when uncertain
2. **Human Validation** - Every stage requires approval
3. **Chain-of-Thought** - Show reasoning explicitly
4. **BABOK Alignment** - Stay compliant with BABOK v3

#### Testing Requirements
- Test with at least 2 different LLM platforms
- Validate across all 8 stages
- Ensure backward compatibility
- Document any breaking changes

#### Prompt Modification Guidelines
```
✅ DO:
- Improve clarity of instructions
- Add helpful examples
- Enhance error handling
- Improve template structure

❌ DON'T:
- Remove human approval requirements
- Skip validation steps
- Hallucinate data or metrics
- Deviate from BABOK v3 framework
```

---

## 🔧 Development Workflow

### 1. Fork the Repository
```bash
# Click "Fork" button on GitHub
# Then clone your fork:
git clone https://github.com/YOUR_USERNAME/BABOK_ANALYST.git
cd BABOK_ANALYST
```

### 2. Create a Branch
```bash
# Create descriptive branch name:
git checkout -b feature/add-german-translation
git checkout -b fix/stage-2-template-typo
git checkout -b docs/improve-api-examples
```

### 3. Make Changes
- Edit files using VS Code or your preferred editor
- Follow style guidelines
- Test thoroughly

### 4. Commit Changes
```bash
# Stage your changes:
git add .

# Commit with descriptive message:
git commit -m "Add German translation to Quick Start Guide

- Translated Quick Start section
- Updated README with German deployment instructions
- Added de-DE language support notes"
```

#### Commit Message Format
```
Short summary (50 chars or less)

Detailed explanation if needed:
- What changed
- Why it changed
- How to test

References: #issue-number
```

### 5. Push and Create Pull Request
```bash
# Push to your fork:
git push origin feature/add-german-translation

# Then create Pull Request on GitHub
```

### 6. Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Template addition
- [ ] Prompt improvement

## Testing Performed
- [ ] Tested with Claude.ai
- [ ] Tested with VS Code + Copilot
- [ ] Tested all 8 stages
- [ ] Documentation builds correctly

## Checklist
- [ ] Code follows project style guidelines
- [ ] Documentation updated (if needed)
- [ ] No breaking changes (or documented)
- [ ] BABOK v3 alignment maintained
- [ ] Human-in-the-loop validation preserved

## Screenshots (if applicable)
[Add screenshots here]

## Related Issues
Closes #issue-number
```

---

## 🧪 Testing Guidelines

### For Agent Prompt Changes
1. **Unit Test** - Test specific section in isolation
2. **Integration Test** - Test full stage end-to-end
3. **System Test** - Run all 8 stages in sequence
4. **Platform Test** - Verify on Claude.ai + VS Code minimum

### Test Checklist
```
✅ Agent asks appropriate questions
✅ Reasoning is clear and logical
✅ Templates generate correctly
✅ Human approval points work
✅ Error handling works properly
✅ Documentation format is correct
✅ No hallucination of data
✅ BABOK compliance maintained
```

### Sample Test Scenario
```
Stage: 4 (Requirements Definition)
Test: User Story Creation

Input: "Create user story for invoice upload"

Expected Output:
- User story in proper format (As a [role]...)
- Acceptance criteria listed
- Story points estimated
- Dependencies identified
- No specific values hallucinated (asks user)

Pass/Fail: [Document result]
```

---

## 📋 Code of Conduct

### Our Standards

**Positive Behavior:**
- Using welcoming and inclusive language
- Respecting differing viewpoints
- Accepting constructive criticism
- Focusing on what's best for the community
- Showing empathy towards others

**Unacceptable Behavior:**
- Harassment of any kind
- Trolling or insulting comments
- Public or private harassment
- Publishing others' private information
- Other conduct inappropriate for professional setting

### Enforcement
Violations may result in temporary or permanent ban from project participation.

---

## 🏆 Recognition

Contributors will be recognized in:
- CHANGELOG.md (for significant contributions)
- README.md Contributors section (coming in v1.1)
- Release notes

---

## 📄 License Agreement

By contributing, you agree that your contributions will be licensed under the MIT License.

You also confirm that:
- You have the right to submit the contribution
- Your contribution is your original work
- You understand the MIT License terms

---

## 🤝 Getting Help

### Questions About Contributing?
- 📧 Open a GitHub Discussion (coming soon)
- 💬 Comment on relevant issue
- 🐛 Create issue with `[Question]` prefix

### Need Technical Help?
- 📚 Read [README.md](README.md) first
- 🚀 Check [Quick Start Guide](BABOK_AGENT/BABOK_Agent_Quick_Start_Guide.md)
- 📖 Review [System Prompt](BABOK_AGENT/BABOK_Agent_System_Prompt.md)

---

## 🎯 Priority Areas for Contribution

### v1.0.x (Minor improvements)
- [ ] Fix typos and grammar issues
- [ ] Improve code examples
- [ ] Add troubleshooting scenarios
- [ ] Enhance error messages

### v1.1 (Planned features)
- [ ] Video tutorials
- [ ] Industry templates (retail, healthcare, manufacturing)
- [ ] Sample anonymized analyses
- [ ] Integration guides (Jira, Azure DevOps)

### v1.2+ (Future)
- [ ] Multi-language support (German, French, Spanish)
- [ ] Advanced templates
- [ ] Web interface
- [ ] API libraries (Python, Node.js)

---

## 📊 Contribution Stats

We track:
- Number of contributions per release
- Types of contributions (docs, code, templates)
- Community growth

Help us grow! 🌱

---

**Thank you for contributing to BABOK Analyst!**

Your contributions help business analysts worldwide deliver better projects.

---

**Last Updated:** 2026-02-07  
**Version:** 1.0.0
