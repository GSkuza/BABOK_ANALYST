# STAGE 2: CURRENT STATE ANALYSIS (AS-IS)

**BABOK Knowledge Area:** Strategy Analysis, Elicitation and Collaboration
**Model Tier:** Standard Mode (with Deep Analysis for complex process bottleneck identification)
**Estimated Duration:** 1-2 hours active work + 3-5 days for data gathering

**CLI Command:** `babok approve <id> 2` — marks Stage 2 as approved and advances to Stage 3
**CLI Reject:** `babok reject <id> 2 -r "reason"` — rejects Stage 2 with reason

---

## Objectives

1. Document current business processes (AS-IS process maps)
2. Identify pain points and inefficiencies
3. Collect baseline metrics (time, cost, volume, error rates)
4. Map current system landscape and data flows
5. Establish quantitative cost baseline for ROI calculation in Stage 8

## Prerequisites

- Stage 1 approved (project scope, stakeholders, success criteria defined)
- Access to stakeholders for interviews/workshops
- Access to operational data (transaction volumes, processing times, costs)

## Process

### Step 2.1: Process Mapping (AS-IS)

**Assumptions:**
- Key business processes identified in Stage 1 scope
- Processes span multiple departments and systems
- Some processes are manual or semi-automated

**Evidence:**
- Stage 1: Project scope definition and system landscape
- BABOK technique: Process Modeling (BPMN)

**QUESTIONS FOR HUMAN:**

1. **Core Processes to Map:**
   Based on Stage 1 scope, which processes should we document in detail?
   List the top 3-5 business processes that are most critical:
   - Process 1: [NAME] — trigger: [what starts it] → output: [what it produces]
   - Process 2: [NAME] — trigger: [what starts it] → output: [what it produces]
   - Process 3: [NAME] — trigger: [what starts it] → output: [what it produces]

2. **For each core process, describe the current workflow:**
   - Who initiates the process? [ROLE]
   - What are the key steps? (list in order)
   - What systems are used at each step?
   - Where are handoffs between people/departments?
   - Where are manual steps (data entry, paper handling, email)?
   - What is the approval chain?
   - How does the process end?

3. **Process Variants:**
   Are there different paths for the same process?
   (e.g., different handling for domestic vs. international, small vs. large value, standard vs. exception)

4. **Process Exceptions:**
   What are the most common exceptions or error scenarios?
   How are they currently handled?

**WAIT FOR HUMAN INPUT.**

---

### Step 2.2: Pain Point Identification

**Assumptions:**
- Users experience daily friction with current processes
- Pain points cluster around manual work, delays, and errors
- Some pain points are visible (complaints), others hidden (workarounds)

**Evidence:**
- Stage 1: Stakeholder register (who experiences pain)
- Industry benchmarks for process efficiency

**QUESTIONS FOR HUMAN:**

1. **Top Pain Points:**
   What are the biggest frustrations with current processes? Rank 1-5:
   - Pain Point 1: [DESCRIPTION] — frequency: [daily/weekly/monthly]
   - Pain Point 2: [DESCRIPTION] — frequency: [daily/weekly/monthly]
   - Pain Point 3: [DESCRIPTION] — frequency: [daily/weekly/monthly]
   - Pain Point 4: [DESCRIPTION] — frequency: [daily/weekly/monthly]
   - Pain Point 5: [DESCRIPTION] — frequency: [daily/weekly/monthly]

2. **Workarounds:**
   What workarounds do people use to deal with current limitations?
   (e.g., Excel spreadsheets for tracking, email for approvals, manual data re-entry between systems)

3. **System Limitations:**
   What can't the current systems do that you wish they could?
   - System [NAME]: [LIMITATION]
   - System [NAME]: [LIMITATION]

4. **Impact of Pain Points:**
   For the top 3 pain points, estimate:
   - Time wasted per occurrence: [X minutes/hours]
   - Frequency: [X times per day/week/month]
   - Financial impact (if known): [CURRENCY/year]
   - Risk impact: [compliance risk, customer impact, employee morale]

**WAIT FOR HUMAN INPUT.**

---

### Step 2.3: Baseline Metrics Collection

**Assumptions:**
- Some metrics available from systems (ERP reports, logs)
- Some metrics require manual measurement or estimation
- Estimates with confidence levels are acceptable where exact data unavailable

**Evidence:**
- Stage 1: Success criteria (defines what metrics we need)
- Standard operational metrics framework

**QUESTIONS FOR HUMAN:**

1. **Volume Metrics:**
   - Total [primary transaction type] processed per month: [NUMBER]
   - Total [secondary transaction type] per month: [NUMBER]
   - Number of users involved in the process: [NUMBER]
   - Peak periods: [DESCRIBE — e.g., month-end, quarter-end, seasonal]

2. **Time Metrics:**
   - Average time to complete [primary process]: [X hours/days]
   - Average approval cycle time: [X days]
   - Average time to retrieve historical information: [X minutes]
   - Time spent on manual data entry per [unit]: [X minutes]

3. **Cost Metrics:**
   - FTE hours spent on [primary process] per month: [X hours]
   - Average hourly cost per employee involved: [X CURRENCY]
   - Annual operational costs for this area: [X CURRENCY]
   - Annual costs for current systems (licenses, maintenance): [X CURRENCY]
   - Physical costs (paper, printing, storage, postage): [X CURRENCY/year]

4. **Quality Metrics:**
   - Error rate in [primary process]: [X%] (or estimate: LOW / MEDIUM / HIGH)
   - Number of compliance issues per year: [NUMBER]
   - Lost or misplaced items per year: [NUMBER or %]
   - Customer/internal complaints related to this process: [NUMBER/year]

5. **Confidence Level:**
   For estimates provided above, rate your confidence:
   - HIGH: Based on system reports or measured data
   - MEDIUM: Based on experience, reasonable estimate
   - LOW: Rough guess, needs validation

**WAIT FOR HUMAN INPUT.**

---

### Step 2.4: System and Data Flow Analysis

**Assumptions:**
- Multiple systems involved in the process
- Data flows between systems may be manual (re-entry) or automated (API/batch)
- Some data may be duplicated or inconsistent across systems

**Evidence:**
- Stage 1: System landscape inventory
- Process maps from Step 2.1

**QUESTIONS FOR HUMAN:**

1. **System Integration:**
   For each system pair, how does data flow between them?
   | From System | To System | Method | Frequency | Issues |
   |------------|-----------|--------|-----------|--------|
   | [System A] | [System B] | [Manual/API/File/Email] | [Real-time/Daily/Weekly] | [Any known issues] |

2. **Data Quality Issues:**
   - Are there data discrepancies between systems? Where?
   - Is there duplicate data entry? Which fields/systems?
   - Are there data validation gaps? (e.g., no checks for incorrect values)

3. **Access and Security:**
   - Who has access to which systems? Is it role-based?
   - Are there shared login accounts?
   - How are sensitive data (financial, personal) protected?

**WAIT FOR HUMAN INPUT.**

---

## Deliverable Template: STAGE_02_Current_State_Analysis.md

```markdown
# STAGE 2: CURRENT STATE ANALYSIS (AS-IS)

**Project:** [Project Name]
**Project ID:** [BABOK-YYYYMMDD-XXXX]
**Date:** [AUTO-GENERATED]
**Status:** APPROVED BY HUMAN on [DATE]

---

## EXECUTIVE SUMMARY (1 PAGE)

**Purpose of This Stage:**
Document current state of business processes, systems, and metrics to establish a baseline for measuring improvement.

**Key Findings:**
1. [X] core processes mapped; [PRIMARY BOTTLENECK] identified as largest inefficiency
2. Current annual cost of operations: [X CURRENCY] ([Y FTE hours/month])
3. [Z] pain points documented; top 3 account for [W%] of time waste

**Cost Baseline:**
| Cost Category | Annual Amount | % of Total |
|---------------|-------------|------------|
| Labor (FTE hours on process) | [AMOUNT] | [%] |
| System costs (licenses, maintenance) | [AMOUNT] | [%] |
| Physical costs (paper, storage, etc.) | [AMOUNT] | [%] |
| Error/rework costs | [AMOUNT] | [%] |
| **TOTAL** | **[AMOUNT]** | **100%** |

**Critical Issues:**
- [Issue 1]: [Impact description]
- [Issue 2]: [Impact description]

**Next Steps After Approval:**
1. Analyze root causes of identified problems (Stage 3)
2. Prioritize problems by impact and feasibility

---

## DETAILED ANALYSIS

### 1. AS-IS PROCESS MAPS

#### Process 1: [Name]
**Trigger:** [What starts the process]
**End State:** [What ends the process]
**Departments Involved:** [List]
**Systems Used:** [List]
**Average Duration:** [Time]
**Monthly Volume:** [Number]

**Process Steps:**
| Step | Actor | Action | System | Duration | Notes |
|------|-------|--------|--------|----------|-------|
| 1 | [Role] | [Action] | [System] | [Time] | [Manual/Auto] |
| 2 | [Role] | [Action] | [System] | [Time] | [Manual/Auto] |
| ... | ... | ... | ... | ... | ... |

**Bottlenecks Identified:**
- [Bottleneck 1]: [Description, time impact]
- [Bottleneck 2]: [Description, time impact]

[Repeat for each core process]

---

### 2. PAIN POINT REGISTER

| ID | Pain Point | Process | Frequency | Time Impact | Cost Impact | Affected Roles |
|----|-----------|---------|-----------|-------------|-------------|----------------|
| PP-001 | [Description] | [Process] | [Daily/Weekly] | [X hrs/month] | [CURRENCY/year] | [Roles] |
| PP-002 | [Description] | [Process] | [Daily/Weekly] | [X hrs/month] | [CURRENCY/year] | [Roles] |
| ... | ... | ... | ... | ... | ... | ... |

**Workarounds Currently Used:**
| Workaround | Purpose | Risk | Effort |
|-----------|---------|------|--------|
| [Description] | [Why it exists] | [What could go wrong] | [Time spent] |

---

### 3. BASELINE METRICS

#### Volume Metrics:
| Metric | Value | Period | Source | Confidence |
|--------|-------|--------|--------|------------|
| [Primary transactions] | [NUMBER] | Monthly | [System/Estimate] | [HIGH/MED/LOW] |
| [Secondary transactions] | [NUMBER] | Monthly | [System/Estimate] | [HIGH/MED/LOW] |
| Users involved | [NUMBER] | - | [HR/Estimate] | [HIGH/MED/LOW] |

#### Time Metrics:
| Metric | Value | Period | Source | Confidence |
|--------|-------|--------|--------|------------|
| [Primary process] duration | [TIME] | Per unit | [Measurement] | [HIGH/MED/LOW] |
| Approval cycle | [DAYS] | Average | [Measurement] | [HIGH/MED/LOW] |
| Information retrieval | [MINUTES] | Per query | [Measurement] | [HIGH/MED/LOW] |

#### Cost Metrics:
| Metric | Value | Period | Source | Confidence |
|--------|-------|--------|--------|------------|
| Labor cost | [AMOUNT] | Annual | [Calculation] | [HIGH/MED/LOW] |
| System costs | [AMOUNT] | Annual | [Invoices] | [HIGH/MED/LOW] |
| Physical costs | [AMOUNT] | Annual | [Invoices/Estimate] | [HIGH/MED/LOW] |
| Error/rework cost | [AMOUNT] | Annual | [Estimate] | [HIGH/MED/LOW] |

#### Quality Metrics:
| Metric | Value | Period | Source | Confidence |
|--------|-------|--------|--------|------------|
| Error rate | [%] | Monthly | [Reports] | [HIGH/MED/LOW] |
| Compliance violations | [NUMBER] | Annual | [Audit reports] | [HIGH/MED/LOW] |
| Lost/misplaced items | [NUMBER/%] | Annual | [Estimate] | [HIGH/MED/LOW] |

---

### 4. SYSTEM AND DATA FLOW

#### Current System Landscape:
| System | Purpose | Users | Version | Vendor Support | Integration |
|--------|---------|-------|---------|----------------|-------------|
| [System 1] | [Purpose] | [N users] | [Version] | [Active/EOL] | [Description] |
| [System 2] | [Purpose] | [N users] | [Version] | [Active/EOL] | [Description] |

#### Data Flow Between Systems:
| From | To | Data Type | Method | Frequency | Issues |
|------|-----|-----------|--------|-----------|--------|
| [System A] | [System B] | [Data] | [Manual/API/File] | [Frequency] | [Issues] |

#### Data Quality Issues:
1. [Issue 1]: [Description and impact]
2. [Issue 2]: [Description and impact]

---

### 5. CURRENT STATE SUMMARY

**Strengths (what works well):**
1. [Strength 1]
2. [Strength 2]

**Weaknesses (what needs improvement):**
1. [Weakness 1] — estimated impact: [CURRENCY/year or time lost]
2. [Weakness 2] — estimated impact: [CURRENCY/year or time lost]

**Risks of Maintaining Status Quo:**
1. [Risk 1]: [Probability] × [Impact] = [Risk Level]
2. [Risk 2]: [Probability] × [Impact] = [Risk Level]

---

## HUMAN APPROVAL

**Next Command:** `Approve 2` to proceed to Stage 3
```

---

## Quality Checklist for Stage 2

Before presenting for approval:

- [ ] All core processes mapped with steps, actors, systems, and durations
- [ ] Pain points documented with frequency and impact estimates
- [ ] Baseline metrics collected for volume, time, cost, and quality
- [ ] System landscape documented with integration methods
- [ ] Data flow between systems mapped
- [ ] Cost baseline calculated (used in Stage 8 ROI)
- [ ] Strengths and weaknesses summarized
- [ ] All data sources and confidence levels documented
- [ ] Process maps validated with process owners

---

**Version:** 1.4
**Stage Owner:** Business Analyst
**BABOK Techniques Used:** Process Modeling, Observation, Document Analysis, Interviews, Data Mining
