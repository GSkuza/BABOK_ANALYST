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

## Deliverable Template

**Single source of truth:** `templates/stages/STAGE_02_Current_State_Analysis.md`

Load before writing the deliverable:
- MCP: `babok_get_stage_template` with `stage_n: 2`
- CLI/file: read `templates/stages/STAGE_02_Current_State_Analysis.md`

**Critical:** Keep all H2 headings from the template unchanged so `babok score` completeness checks pass.

---

## Single-Request Generation Procedure (MANDATORY)

Generate the complete deliverable in exactly one LLM request. Treat the groups below as the required section
order inside that response. Perform consistency and quality checks internally before returning the final
Markdown; do not make separate LLM calls for scoring, critique, revision, or summarisation.

1. **Batch "core"** — Executive Summary, AS-IS Process Map or BPMN description, Pain Points Analysis.
   Describe the actual current process implied by Stage 1's scope, not a generic process template. Every
   pain point should be traceable to something in scope.
2. **Batch "metrics"** — Baseline Metrics, System Inventory, Bottleneck Identification. Use the process
   map above. Baseline metrics need real units/time periods, not vague qualitative descriptions. Each
   bottleneck must cite a measurable impact tied to a step in the process map.
3. **Batch "closing"** — Quality Checklist, Approval Section. Use the complete document above as context.

Before returning the response, check the entire document once — are baseline metrics genuinely numeric
with units, does every pain point trace to a real Stage 1 item, does every bottleneck cite a measurable
impact? Fix anything that reads as generic filler before saving and submitting it for human review.

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
