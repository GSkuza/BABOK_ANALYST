# STAGE 3: PROBLEM DOMAIN ANALYSIS

**BABOK Knowledge Area:** Strategy Analysis, Requirements Analysis and Design Definition
**Model Tier:** DEEP ANALYSIS MODE (Gemini Pro 3 / Claude Opus 4.6)
**Estimated Duration:** 45-60 minutes active work + 1-2 days for validation

**CLI Command:** `babok approve <id> 3` — marks Stage 3 as approved and advances to Stage 4
**CLI Reject:** `babok reject <id> 3 -r "reason"` — rejects Stage 3 with reason

---

## Why Deep Analysis Mode

- Root cause identification requires sophisticated reasoning
- Prioritization involves multi-factor decision-making
- Problem interdependencies may not be immediately obvious
- Novel problems may not have standard BABOK solutions

```
[DEEP ANALYSIS MODE ACTIVATED]
Model: Gemini Pro 3 / Claude Opus 4.6
Reasoning: Stage 3 requires root cause analysis using 5 Whys, Ishikawa diagrams,
           and impact-effort prioritization — complex synthesis task
Context: [Data from Stages 1-2, industry benchmarks, regulatory constraints]
```

---

## Objectives

1. Categorize all problems identified in Stage 2
2. Perform root cause analysis (5 Whys, Ishikawa diagrams)
3. Assess impact and effort for each problem
4. Prioritize problems using impact-effort matrix
5. Identify quick wins and strategic initiatives
6. Map problem dependencies and cascading effects

## Prerequisites

- Stage 2 approved (AS-IS processes, pain points, baseline metrics documented)
- All baseline data validated by stakeholders

## Process

### Step 3.1: Problem Categorization

**Assumptions:**
- Problems from Stage 2 can be grouped into logical categories
- Categories typically include: Process, Technology, People, Data, Compliance

**Evidence:**
- Stage 2: Pain point register (PP-001 through PP-XXX)
- Stage 2: System limitations and data quality issues

**Agent Action (no human input needed):**

Using Stage 2 data, categorize all identified problems:

| Category | Description | Problem IDs |
|----------|-------------|-------------|
| **Process** | Inefficient workflows, manual steps, bottlenecks | [PP-XXX, ...] |
| **Technology** | System limitations, missing integrations, outdated tools | [PP-XXX, ...] |
| **People** | Skill gaps, resistance to change, resource constraints | [PP-XXX, ...] |
| **Data** | Quality issues, duplication, inconsistency, access problems | [PP-XXX, ...] |
| **Compliance** | Regulatory gaps, audit failures, policy violations | [PP-XXX, ...] |
| **Organization** | Communication gaps, unclear responsibilities, silos | [PP-XXX, ...] |

**QUESTIONS FOR HUMAN:**

1. **Category Validation:**
   Review the categorization above. Any problems miscategorized?

2. **Missing Problems:**
   Are there problems NOT captured in Stage 2 that should be included?

3. **Problem Severity:**
   For each category, which problems are CRITICAL (must solve) vs. IMPORTANT (should solve) vs. NICE-TO-HAVE?

**WAIT FOR HUMAN INPUT.**

---

### Step 3.2: Root Cause Analysis

**Assumptions:**
- Most pain points are symptoms of deeper root causes
- Multiple symptoms may share a common root cause
- Solving root causes eliminates multiple symptoms simultaneously

**Evidence:**
- Stage 2: Pain point details and context
- BABOK technique: Root Cause Analysis (5 Whys, Ishikawa)

**Agent Action:** For each CRITICAL problem, perform:

#### 5 Whys Analysis

**Problem: [PP-XXX — Description]**

| Level | Question | Answer |
|-------|----------|--------|
| Why 1? | Why does [symptom] occur? | [Because...] |
| Why 2? | Why does [answer 1] happen? | [Because...] |
| Why 3? | Why does [answer 2] happen? | [Because...] |
| Why 4? | Why does [answer 3] happen? | [Because...] |
| Why 5? | Why does [answer 4] happen? | **ROOT CAUSE: [Description]** |

[Repeat for each critical problem]

#### Ishikawa (Fishbone) Diagram

For the top 3 problems, create Ishikawa diagrams analyzing contributing factors across:
- **Methods** (processes, procedures)
- **Machines** (systems, tools, technology)
- **Materials** (data, documents, inputs)
- **Manpower** (people, skills, training)
- **Measurement** (metrics, monitoring, feedback)
- **Environment** (culture, regulations, market)

**QUESTIONS FOR HUMAN:**

1. **Root Cause Validation:**
   Review the root causes identified above. Do they match your experience?
   For each root cause, rate your agreement:
   - AGREE: This is the real root cause
   - PARTIALLY AGREE: Close but needs adjustment: [SPECIFY]
   - DISAGREE: The real root cause is: [SPECIFY]

2. **Additional Context:**
   For any root cause, is there additional context we should consider?
   (e.g., historical reasons, political factors, vendor constraints)

**WAIT FOR HUMAN INPUT.**

---

### Step 3.3: Impact-Effort Prioritization

**Assumptions:**
- Not all problems can be solved at once
- Resources (budget, time, people) are limited
- Quick wins build momentum and stakeholder confidence
- Strategic initiatives deliver long-term value

**Evidence:**
- Stage 2: Baseline metrics (cost impact of each problem)
- Stage 1: Budget and timeline constraints
- Root cause analysis from Step 3.2

**Agent Action:** Create impact-effort matrix:

#### Impact Assessment:

| Root Cause ID | Description | Annual Cost Impact | Risk Impact | Strategic Value | Total Impact Score |
|---------------|-------------|-------------------|-------------|-----------------|-------------------|
| RC-001 | [Root cause] | [CURRENCY/year] | [HIGH/MED/LOW] | [HIGH/MED/LOW] | [1-10] |
| RC-002 | [Root cause] | [CURRENCY/year] | [HIGH/MED/LOW] | [HIGH/MED/LOW] | [1-10] |

#### Effort Assessment:

| Root Cause ID | Implementation Complexity | Cost Estimate | Timeline | Dependencies | Total Effort Score |
|---------------|--------------------------|---------------|----------|-------------|-------------------|
| RC-001 | [HIGH/MED/LOW] | [CURRENCY range] | [Weeks/Months] | [List] | [1-10] |
| RC-002 | [HIGH/MED/LOW] | [CURRENCY range] | [Weeks/Months] | [List] | [1-10] |

#### Impact-Effort Matrix:

```
HIGH IMPACT
    │
    │  ★ STRATEGIC        ★ QUICK WINS
    │  (High Impact,       (High Impact,
    │   High Effort)        Low Effort)
    │  → Plan carefully    → DO FIRST
    │
    ├─────────────────────────────────────
    │
    │  ✗ AVOID             ◆ FILL-INS
    │  (Low Impact,        (Low Impact,
    │   High Effort)        Low Effort)
    │  → Deprioritize      → Do if time allows
    │
LOW IMPACT
    LOW EFFORT ──────────── HIGH EFFORT
```

**QUESTIONS FOR HUMAN:**

1. **Priority Validation:**
   Review the impact-effort placement. Do you agree with the quadrant assignments?

2. **Quick Wins:**
   Which items in the "Quick Wins" quadrant should we tackle first?

3. **Strategic Items:**
   For "Strategic" items (high impact, high effort), are you willing to invest the required resources?

4. **Items to Exclude:**
   Are there any items we should exclude from the project scope?

**WAIT FOR HUMAN INPUT.**

---

### Step 3.4: Problem Dependency Mapping

**Agent Action:** Map dependencies between problems:

| Problem | Depends On | Blocks | Cascading Effect |
|---------|-----------|--------|-----------------|
| [RC-001] | None (independent) | [RC-003, RC-005] | Solving this unlocks [X] other improvements |
| [RC-002] | [RC-001] | [RC-004] | Cannot be solved until [RC-001] is addressed |

**Critical Path:** The sequence of dependent problems that determines the minimum timeline.

---

## Deliverable Template: STAGE_03_Problem_Domain_Analysis.md

```markdown
# STAGE 3: PROBLEM DOMAIN ANALYSIS

**Project:** [Project Name]
**Project ID:** [BABOK-YYYYMMDD-XXXX]
**Date:** [AUTO-GENERATED]
**Status:** APPROVED BY HUMAN on [DATE]

---

## EXECUTIVE SUMMARY (1 PAGE)

**Purpose of This Stage:**
Identify root causes of current state problems and prioritize them for solution design.

**Key Findings:**
1. [X] root causes identified from [Y] symptoms documented in Stage 2
2. [Z] quick wins identified with estimated savings of [CURRENCY/year]
3. [W] strategic initiatives required for long-term improvement
4. Critical dependency chain: [RC-A] → [RC-B] → [RC-C]

**Recommended Priority Order:**
| Priority | Root Cause | Quadrant | Expected Impact | Timeline |
|----------|-----------|----------|-----------------|----------|
| 1 | [Quick Win 1] | Quick Win | [Impact] | [Weeks] |
| 2 | [Quick Win 2] | Quick Win | [Impact] | [Weeks] |
| 3 | [Strategic 1] | Strategic | [Impact] | [Months] |
| ... | ... | ... | ... | ... |

---

## DETAILED ANALYSIS

### 1. PROBLEM CATEGORIZATION
[Full categorization table]

### 2. ROOT CAUSE ANALYSIS
[5 Whys for each critical problem]
[Ishikawa diagrams for top 3 problems]

### 3. IMPACT-EFFORT MATRIX
[Full scoring and matrix visualization]

### 4. DEPENDENCY MAP
[Problem dependencies and critical path]

### 5. RECOMMENDED APPROACH
[Prioritized list with rationale for sequencing]

---

## HUMAN APPROVAL

**Next Command:** `Approve 3` to proceed to Stage 4
```

---

## Quality Checklist for Stage 3

Before presenting for approval:

- [ ] All Stage 2 pain points categorized
- [ ] Root cause analysis performed for all CRITICAL problems
- [ ] 5 Whys analysis reaches genuine root causes (not just symptoms)
- [ ] Ishikawa diagrams created for top 3 problems
- [ ] Impact scored with financial data from Stage 2
- [ ] Effort scored with realistic estimates
- [ ] Impact-effort matrix populated with all root causes
- [ ] Quick wins clearly identified
- [ ] Problem dependencies mapped
- [ ] Priority order validated by human
- [ ] No hallucinated data — all based on Stage 1-2 evidence

---

**Version:** 1.4
**Stage Owner:** Business Analyst
**BABOK Techniques Used:** Root Cause Analysis, Ishikawa Diagram, Prioritization Matrix, Dependency Mapping
