# STAGE 1: PRODUCT & REPOSITORY BASELINE

**Initiative ID:** [SD-YYYYMMDD-XXXX]
**Baseline ID:** [product-id/baseline-NN]
**Date:** [YYYY-MM-DD]
**Status:** DRAFT — Pending Approval

---

## Executive Summary

[What the product does, in one paragraph, and the scope/confidence of this baseline]

---

## Repository Inventory & Pinned Commits

| Repository | Host | Ref | Commit SHA | Dirty Tree? | Excluded Areas |
|------------|------|-----|------------|-------------|-----------------|
| [name] | [github/gitlab] | [branch/tag] | [sha] | [No / Yes — snapshot ref] | [vendored deps, binaries, ...] |

---

## Business Context

**Purpose:** [What business problem the product solves, evidenced by EV-NNN]

**Users:** [Who uses it and how]

**Domain rules:** [Key business rules encoded in the product, each with an EV-NNN citation]

**Prior decisions:** [Relevant decisions from earlier approved stages/journal history, if any]

---

## Technology Context

**Modules & entry points:** [Key modules/services and their entry points, each with EV-NNN citation]

**Dependencies:** [Key runtime/library dependencies and their declared versions]

**Data models & APIs:** [Core data models and API surfaces, each with EV-NNN citation]

**Tests:** [Test suites present and what they cover]

---

## System Inventory

| System / Component | Repository | Role | Evidence |
|---------------------|------------|------|----------|
| [SystemName] | [repo] | [what it does] | [EV-NNN] |

---

## Architecture Context

**Component boundaries:** [Named components and their responsibilities]

**Data flow:** [How data moves between components]

**Integration points:** [External/internal integration points, each with EV-NNN citation]

**Quality attributes / constraints:** [Performance, security, scalability constraints found in code or config]

**Confirmed vs. documentation-only:** [State explicitly which architecture claims are confirmed by code and which rest only on documentation]

---

## SDLC Context

**Build & CI/CD:** [Build system and CI/CD pipeline configuration found]

**Branching & review:** [Branching model and review requirements found]

**Release & rollback:** [Release cadence and rollback mechanism found, or explicit gap]

---

## Baseline Metrics

| Metric | Current Value | Source | Confidence |
|--------|-----------------|--------|------------|
| [e.g. test coverage, build time, defect rate] | [value or TBD] | [EV-NNN] | [Low/Medium/High] |

---

## Evidence Ledger

| ID | Repository | Ref/Commit | Path / Symbol | Claim Supported |
|----|------------|------------|-----------------|-------------------|
| EV-001 | [repo] | [sha] | [path#symbol] | [what this evidences] |

---

## Assumptions & Open Gaps

| ID | Statement | Type (Assumption/Hypothesis/Gap) | Impact | Confidence |
|----|-----------|-----------------------------------|--------|------------|
| A-001 | [statement] | [type] | [decision impact] | [Low/Medium/High] |

---

## Quality Checklist

- [ ] Every repository has a pinned commit/ref or disclosed dirty-tree snapshot
- [ ] Business, Technology, Architecture and SDLC sections cite specific evidence
- [ ] Every unverifiable claim is labelled Hypothesis/Assumption with confidence
- [ ] Excluded files/areas and their impact are disclosed
- [ ] Any human-asked question was genuinely business-owned

---

## Approval Section

| Field | Value |
|-------|-------|
| Approver | [Name, Title] |
| Date | [YYYY-MM-DD] |
| Comments | [Optional] |

**Change log**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | [YYYY-MM-DD] | [Author] | Initial baseline |
