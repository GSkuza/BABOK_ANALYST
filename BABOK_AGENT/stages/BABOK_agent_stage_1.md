# STAGE 1: PROJECT INITIALIZATION & STAKEHOLDER MAPPING

**BABOK Knowledge Area:** Business Analysis Planning and Monitoring, Elicitation and Collaboration
**Model Tier:** Standard Mode
**Estimated Duration:** 30-45 minutes active work + 1-2 days for data gathering

**CLI Command:** `babok approve <id> 1` — marks Stage 1 as approved and advances to Stage 2
**CLI Reject:** `babok reject <id> 1 -r "reason"` — rejects Stage 1 with reason

---

## Objectives

1. Clarify project scope and boundaries
2. Identify all stakeholders and their interests
3. Define success criteria (quantitative and qualitative)
4. Establish communication plan
5. Document assumptions, dependencies, and constraints

## Prerequisites

- `BEGIN NEW PROJECT` command executed (Project ID generated)
- Human available to answer scoping questions

## Process

### Step 1.1: Scope Clarification

**Assumptions:**
- Project involves IT solution implementation or process improvement
- Multiple departments affected
- Regulatory compliance may be a driver

**Evidence:**
- User initiated BABOK analysis (implies significant project)
- Mid-market company profile (implies complexity)

**QUESTIONS FOR HUMAN:**

1. **Project Scope - What is the project about?**
   Describe the business problem or opportunity in 2-3 sentences.

2. **Current Systems Landscape:**
   - ERP System: [NAME & VERSION]
   - Other core business systems: [NAME & VERSION for each]
   - Existing solution for this area (if any): [NAME or "None currently"]
   - Other relevant systems: [LIST]

3. **Regulatory Compliance Requirements:**
   Which regulations are CRITICAL for this project?
   [ ] GDPR (EU Data Protection Regulation)
   [ ] Financial reporting (SOX, local GAAP, IFRS)
   [ ] E-invoicing mandate (specify country: _____)
   [ ] Industry certifications (ISO 9001, ISO 27001, etc.)
   [ ] Sector-specific (FDA, automotive OEM, other)
   [ ] Tax compliance (VAT/GST, transfer pricing)
   [ ] Other: [SPECIFY]

4. **Compliance Deadlines:**
   Are there hard deadlines driven by regulation?
   - Deadline 1: [REGULATION] by [DATE]
   - Deadline 2: [REGULATION] by [DATE]

6. **Budget & Timeline Constraints:**
   - Estimated budget range: [MIN] - [MAX] [CURRENCY]
   - Target go-live date: [DATE]
   - Hard deadline (if any): [DATE and reason]

**WAIT FOR HUMAN INPUT BEFORE PROCEEDING.**

---

### Step 1.2: Stakeholder Identification

**Assumptions:**
- Mid-market company has standard org structure
- Primary user group depends on project domain
- IT department is implementation partner
- C-level approval needed for budget and strategic alignment

**Evidence:**
- Standard BABOK stakeholder analysis framework
- Industry best practices for mid-market projects

**PRELIMINARY STAKEHOLDER LIST:**

| Stakeholder Group | Key Roles | Interest Level | Influence Level | Initial Assessment |
|-------------------|-----------|----------------|-----------------|-------------------|
| C-Level | CEO, CFO | HIGH | HIGH | Budget approval, strategic alignment |
| Primary Business Unit | [Domain Head, Team Leads] | HIGH | HIGH | Primary users, process owners |
| Operations | COO, Operations Manager | MEDIUM | MEDIUM | Process execution |
| IT | IT Manager, System Administrators | HIGH | HIGH | Technical implementation, integration |
| Legal/Compliance | Legal Counsel, Compliance Officer | MEDIUM | HIGH | Regulatory requirements, audit |
| Finance | CFO, Finance Manager | HIGH | HIGH | Budget, ROI validation |
| Other affected departments | [Identify based on scope] | MEDIUM | MEDIUM | Secondary users |

**QUESTIONS FOR HUMAN:**

1. **Key Individuals:**
   Please provide names and roles for key stakeholders:
   - Project Sponsor: [NAME, TITLE]
   - Primary Decision Maker (budget authority): [NAME, TITLE]
   - Primary Business Unit Lead: [NAME, TITLE]
   - IT Lead: [NAME, TITLE]
   - Compliance/Legal Lead: [NAME, TITLE] or "N/A"

2. **Stakeholder Additions:**
   Are there other stakeholder groups NOT listed above?
   [LIST ANY ADDITIONAL]

3. **External Stakeholders:**
   Are there external parties involved?
   [ ] External auditors
   [ ] Consultants / system integrators
   [ ] Vendors (current or potential)
   [ ] Regulatory bodies (direct interaction)
   [ ] Customers / partners
   [ ] Other: [SPECIFY]

**WAIT FOR HUMAN INPUT.**

---

### Step 1.3: Success Criteria Definition

**Assumptions:**
- Success measurable through time savings, cost reduction, and compliance achievement
- ROI expected within 18-24 months (standard for mid-market IT projects)
- Quality improvements (error reduction) are secondary benefits

**Evidence:**
- Industry benchmarks for similar projects
- BABOK best practices for success criteria definition

**PROPOSED SUCCESS METRICS:**

**QUANTITATIVE:**

1. **Time Savings:**
   - Primary process time: [BASELINE] → [TARGET] (% reduction)
   - Approval cycle: [BASELINE] days → [TARGET] days
   - Information retrieval time: [BASELINE] min → [TARGET] min

2. **Cost Savings:**
   - FTE hours saved: [NUMBER] hours/month
   - Operational costs: [BASELINE] [CURRENCY]/year → [TARGET] [CURRENCY]/year
   - Total annual savings target: [AMOUNT] [CURRENCY]

3. **Quality Improvements:**
   - Error rate: [BASELINE]% → [TARGET]% (<2% industry benchmark)
   - Compliance violations: [BASELINE]/year → 0/year

4. **ROI Targets:**
   - Payback period: < [X] months
   - 3-year NPV: > [AMOUNT] [CURRENCY]
   - IRR: > [X]%

**QUALITATIVE:**

5. User satisfaction: > 4/5 in post-implementation survey
6. Audit readiness: 100% compliance with critical requirements
7. Process standardization across departments

**QUESTIONS FOR HUMAN:**

1. **Baseline Metrics:**
   What are CURRENT values? (estimates OK if exact data unavailable)
   - Primary process time: [X hours/minutes]
   - Average approval cycle: [X days]
   - Annual operational costs for this area: [AMOUNT in CURRENCY]
   - Current error rate (if known): [X%]

2. **Target Improvements:**
   What are realistic TARGET values?
   - Process time target: [X hours/minutes]
   - Approval cycle target: [X days]
   - Cost reduction target: [X% or AMOUNT]

3. **Primary Business Driver:**
   What is the #1 reason for this project?
   [ ] Cost reduction / efficiency
   [ ] Risk mitigation / compliance
   [ ] Growth enablement / scalability
   [ ] Competitive advantage / customer service
   [ ] Other: [SPECIFY]

4. **ROI Expectations:**
   - Maximum acceptable payback period: [X months]
   - Minimum acceptable ROI: [X% over Y years]

**WAIT FOR HUMAN INPUT.**

---

## Deliverable Template

**Single source of truth:** `templates/stages/STAGE_01_Project_Initialization.md`

Load before writing the deliverable:
- MCP: `babok_get_stage_template` with `stage_n: 1`
- CLI/file: read `templates/stages/STAGE_01_Project_Initialization.md`

**Critical:** Keep all H2 headings from the template unchanged so `babok score` completeness checks pass.

---

## Single-Request Generation Procedure (MANDATORY)

Generate the complete deliverable in exactly one LLM request. Treat the groups below as the required section
order inside that response. Perform consistency and quality checks internally before returning the final
Markdown; do not make separate LLM calls for scoring, critique, revision, or summarisation.

1. **Batch "core"** — Executive Summary, Project Scope — In Scope, Project Scope — Out of Scope.
   Define what this project actually covers and excludes, in terms specific to the stated industry and
   systems — not generic scope boilerplate.
2. **Batch "landscape_stakeholders"** — System Landscape, Stakeholder Register, RACI Matrix.
   Use the scope from the core batch above. Name real systems and real stakeholder roles implied by that
   scope; the RACI must reference the same roles listed in the Stakeholder Register, not generic placeholders.
3. **Batch "success_criteria"** — Success Criteria — Quantitative KPIs, Success Criteria — ROI Targets,
   Communication Plan. KPIs must have real numeric baseline/target values grounded in the project context,
   not placeholder numbers.
4. **Batch "constraints_compliance"** — Regulatory Requirements, Project Constraints, Assumptions & Dependencies.
   Regulatory requirements must be consistent with the scope items from the core batch (only flag regulations
   actually implicated by what's in scope).
5. **Batch "closing"** — Open Questions, Quality Checklist, Approval Section. Use the complete document
   above as context.

Before returning the response, check the entire document once against this bar — is every KPI/date/
budget figure grounded in the actual context rather than invented filler, does the RACI genuinely reference
the Stakeholder Register, are regulatory items tied to real scope items? Fix anything that reads as generic
before saving and submitting it for human review.

---

## Quality Checklist for Stage 1

Before presenting for approval:

- [ ] Project scope clearly defined (in-scope and out-of-scope)
- [ ] All stakeholder groups identified with names and roles
- [ ] RACI matrix populated for key activities
- [ ] Success criteria defined with baseline and target values
- [ ] Regulatory requirements identified with deadlines
- [ ] Communication plan established
- [ ] Budget and timeline constraints documented
- [ ] Assumptions and dependencies listed
- [ ] Open questions tracked with owners and target dates

---

**Version:** 1.4
**Stage Owner:** Business Analyst
**BABOK Techniques Used:** Brainstorming, Document Analysis, Interviews, Stakeholder Analysis
