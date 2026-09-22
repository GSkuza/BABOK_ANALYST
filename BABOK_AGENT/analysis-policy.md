# Shared Analysis Policy

This policy defines the analytical standard for **every** BABOK Analyst surface: Web AI interview, CLI chat, MCP tools, plugin chats, and autonomous runs. It applies to every pipeline profile.

It is profile-neutral. Stage prompts define *what* must be covered; this policy defines *how well* it must be reasoned. Where a stage prompt is less demanding than this policy, this policy wins.

---

## 1. Analytical operating model

For every material decision or finding, apply this sequence:

1. **Decision question** — the decision, its owner, its deadline, and the consequence of delay or error.
2. **Scope and unit of analysis** — process, population, product, market, geography, period, and exclusions.
3. **Evidence inventory** — available sources, missing evidence, source dates, and reliability.
4. **Evidence classification** — separate facts, claims, calculations, inferences, hypotheses, assumptions, and unknowns.
5. **Competing hypotheses** — for a material problem, form at least two plausible explanations when evidence permits.
6. **Test plan** — the confirming and disconfirming evidence for each hypothesis.
7. **Causal analysis** — the mechanism connecting cause, behaviour, constraint, and observed outcome.
8. **Quantification** — scale, frequency, cost, time, risk, or value with explicit units and basis.
9. **Uncertainty and sensitivity** — fragile assumptions, tested with ranges or scenarios.
10. **Implications** — what the evidence means for the decision, stakeholders, requirements, risks, and economics.
11. **Recommendation** — only after the evidence chain is visible.

Do not replace this sequence with a framework checklist. Use BABOK techniques, 5 Whys, Ishikawa, PESTEL, Five Forces, SWOT, 7S, DMAIC, JTBD, or similar frameworks only when they reveal a mechanism or change a decision.

---

## 2. Evidence protocol

Classify material statements:

- `[FACT]` — directly supported by a reliable source;
- `[STAKEHOLDER CLAIM]` — reported by a stakeholder but not independently verified;
- `[CALCULATION]` — derived from shown inputs and formula;
- `[INFERENCE]` — conclusion supported by multiple premises;
- `[HYPOTHESIS]` — plausible explanation requiring a test;
- `[ASSUMPTION]` — temporary premise used to continue;
- `[UNKNOWN]` — required information not available.

Use labels in analytical working sections and evidence tables. Executive prose may omit repeated labels when the evidence chain remains unambiguous.

For every key finding, provide:

```text
Conclusion
Supporting evidence, source, and date
Interpretation and causal mechanism
Alternative explanation
Disconfirming or missing evidence
Confidence: High | Medium | Low
What would change the conclusion
Business implication
```

Preferred chain:

```text
Evidence → Interpretation → Implication → Recommendation
```

Rules:

- Never invent a source, quote, benchmark, regulation, competitor fact, or company datum.
- Never present general knowledge as evidence about the analysed organisation.
- A stakeholder statement remains a claim until corroborated.
- A benchmark requires source, publication date, geography, industry, sample, metric definition, and comparability note.
- Do not use an unverified benchmark as the basis of a business case.
- Triangulate material external claims with two independent sources where practical.
- Prefer primary sources, regulators, official statistics, company filings, and sources with transparent methodology.
- If current research is unavailable, state the limitation and create a data-acquisition plan instead of simulating research.
- Separate observed data from calculated values. Show formulas, units, periods, and rounding.
- Use ranges or scenarios when a point estimate would create false precision.

---

## 3. Uncertainty and data gaps

Classify missing information:

| Class | Meaning | Action |
|---|---|---|
| Blocking | Absence could invalidate or materially mislead the decision | Pause the affected conclusion and ask for the minimum necessary evidence |
| Material, non-blocking | Could change magnitude or ranking but analysis can continue | Use bounded scenarios, identify sensitivity, and define validation |
| Optional | Improves detail but is unlikely to change direction | Record as `TBD`; do not interrupt progress |

When evidence is missing:

1. name the gap;
2. explain its decision impact;
3. classify it;
4. propose a proxy, range, or scenario where valid;
5. define the owner and validation method;
6. continue all analysis that remains defensible.

Never ask for a detail merely because a template has an empty field. Ask only when the answer can change a decision, material conclusion, scope boundary, priority, risk, acceptance criterion, or financial result.

---

## 4. Deep Market Analysis

Activate this module when the decision depends materially on market entry, customer demand, product positioning, competitive response, build/buy/partner choice, market-dependent revenue, or external industry economics. If it is not material, state why and do not manufacture a market section.

### A. Market definition

Define customer and user, the need or job to be done, the product or service category, geography, time horizon, primary market, adjacent markets, substitutes, explicit exclusions, and the risk of defining the market too broadly or narrowly.

### B. Customer and demand

Analyse needs-based or behavioural segments, problem intensity and frequency, the buyer/user/influencer/blocker/budget owner, purchase criteria and decision process, willingness to pay and price sensitivity, adoption barriers and switching costs, stated need versus observed behaviour, and evidence quality by segment.

### C. Structure and economics

Analyse the value chain and profit pools, channels and distribution power, supplier and buyer power, concentration and fragmentation, barriers to entry and exit, scale/network/learning/data effects, substitutes and commoditisation risk, regulation and structural constraints, and where value is created versus captured.

### D. Competitive dynamics

Include direct competitors, internal solutions, manual work, do-nothing, substitutes, and credible entrants.

For each material competitor or archetype assess target segment and value proposition, business model and pricing logic, channels and capabilities, source and durability of advantage, weaknesses and switching costs, likely response to the proposed move, and the evidence supporting the assessment.

Do not rank options without explicit criteria, weights, and evidence.

### E. Market sizing

When relevant:

- estimate TAM, SAM, and SOM using both top-down and bottom-up logic where data permits;
- show formulas, sources, assumptions, and unit economics;
- reconcile material differences between methods;
- provide conservative, base, and upside scenarios;
- test sensitivity to the most influential assumptions.

SOM must follow from reachable accounts, capacity, channels, conversion, timing, product constraints, and competitive response. Never use an arbitrary percentage of TAM.

### F. Change dynamics

Translate every material trend into:

```text
Driver → Mechanism → Affected segment → Expected effect → Time horizon → Leading indicator
```

Assess historical drivers, catalysts, constraints, technology, regulation, costs, behaviour changes, possible inflection points, and scenarios.

### G. Strategic synthesis

Conclude with market attractiveness, strategic fit and right to win, conditions necessary for success, the largest uncertainties, strategic options and trade-offs, no-regret moves, reversible versus irreversible decisions, and the indicators that would trigger a strategy change.

---

## 5. Traceability

Maintain traceability in both directions:

```text
Market insight / stakeholder evidence
→ business need
→ problem or root cause
→ requirement or strategic option
→ design or target-operating-model element
→ roadmap change
→ cost and benefit
→ business-case recommendation
```

Also trace:

- risk or uncertainty → validation or mitigation action;
- recommendation → owner, target date, and success measure;
- requirement or option → source, rationale, priority, acceptance or evaluation criteria, and downstream design;
- benefit → KPI baseline, target, calculation, owner, and measurement date.

Use the stable identifiers defined by the active profile and stage. Do not create orphan requirements, options, benefits, risks, or recommendations.

---

## 6. Depth Gate

Before saving and submitting a stage, score each applicable dimension from 0 to 3:

| Dimension | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Evidence quality | None or invented | Mostly unsupported | Adequate, sourced | Triangulated and current |
| Causal depth | Description only | Correlation asserted | Mechanism explained | Mechanism tested against alternatives |
| Alternative explanations | None | Mentioned | Compared | Tested with disconfirming evidence |
| Quantification | Absent | Unbased point values | Units and basis shown | Scenarios and sensitivity shown |
| Market specificity | Generic | Partly contextual | Decision-specific | Segment/economics/dynamics integrated |
| Decision relevance | Unclear | Informative only | Changes a decision | Explicit trade-off and trigger |
| Uncertainty treatment | Hidden | Listed | Classified and bounded | Sensitivity and validation plan |
| Traceability | Broken | Partial | End-to-end for key items | Bidirectional and complete |

Rules:

- Applicable dimensions must score at least 2.
- Stages using Deep Market Analysis require Market Specificity ≥ 2.
- A score of 3 is not required for every stage; use proportional depth.
- If a blocking evidence gap prevents a score of 2, do not submit the stage. State the gap and the acquisition plan.
- If a non-blocking gap remains, document the scenario, confidence, owner, and validation date.

Disqualifying defects regardless of score:

- invented evidence, citation, benchmark, regulation, or calculation input;
- recommendation not traceable to evidence;
- material contradiction ignored;
- stakeholder claim presented as verified fact;
- false precision that can change the decision;
- missing owner for a critical risk or action;
- submission attempted before successful persistence.

---

## 7. Recommendation format

For a key recommendation use:

```markdown
### Recommendation

**Decision:** ...
**Evidence chain:** ...
**Alternative considered:** ...
**Confidence:** High | Medium | Low
**Conditions / triggers:** ...
**Owner and target date:** ...
**Success measure:** ...
```

Do not expose private chain-of-thought. Provide a concise, auditable reasoning summary containing evidence, assumptions, alternatives, uncertainty, and decision implications — sufficient for a reviewer to challenge the conclusion.

Prefer a defensible `UNKNOWN` over an unsupported answer. Optimise for conclusions that are difficult to refute, specific to the organisation and its market, and directly useful for a decision.
