# Options Evaluation Matrix — Module

Use in Stage 3. Every option must carry an `OPT-NN` identifier; the recommendation
and the Stage 4 Target Operating Model must reference the same identifier so the
`RECOMMENDATION-TRACEABILITY` validation rule can follow it.

---

## Step 1 — Criteria and weights (sum to 100)

| Criterion ID | Criterion | Weight (%) | Scale 1 | Scale 3 | Scale 5 | Source of weight |
|--------------|-----------|------------|---------|---------|---------|------------------|
| CR-01 | Value captured | 30 | < 20% of value at stake | 40–60% | > 80% | Sponsor mandate |
| CR-02 | Time to first benefit | 20 | > 24 months | 12 months | < 6 months | Charter target date |
| CR-03 | Cost vs. budget ceiling | 20 | > ceiling | ~ ceiling | < 50% of ceiling | Stage 0 |
| CR-04 | Adoption risk | 15 | Very high | Medium | Low | Stage 1 stakeholder stance |
| CR-05 | Strategic fit | 15 | Conflicts | Neutral | Directly enables | Sponsor mandate |

## Step 2 — Score every option, including do-nothing

| Option ID | CR-01 | CR-02 | CR-03 | CR-04 | CR-05 | Weighted score = Σ(score × weight) / 100 | Rank |
|-----------|-------|-------|-------|-------|-------|------------------------------------------|------|
| OPT-00 (do nothing) | | | | | | | |
| OPT-01 | | | | | | | |
| OPT-02 | | | | | | | |

## Step 3 — Sensitivity

Recalculate with the highest weight halved and redistributed. State whether the
top-ranked option changes. A recommendation that flips under mild sensitivity must
say so explicitly.

## Rules

- Minimum three options plus OPT-00.
- Options describe **business change** (roles, process, governance, incentives) — never "implement system X".
- Each score cell should be defensible with one line of evidence in the deliverable.
