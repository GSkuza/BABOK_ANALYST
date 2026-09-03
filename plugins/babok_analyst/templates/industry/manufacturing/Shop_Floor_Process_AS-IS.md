# Shop Floor Process AS-IS Supplement — Manufacturing

**Industry pack:** manufacturing
**Stage:** 2 — AS-IS Process Map
**Processes to prioritize:** Production order release, material staging, quality hold/release, finished goods posting

---

## Recommended AS-IS Processes

| Process | Trigger | Key Systems | Typical Pain Points |
|---------|---------|-------------|---------------------|
| Production order execution | MRP release | ERP + MES (if any) | Manual confirmations, paper travelers |
| Quality inspection | Lot completion | QMS / Excel | Disconnected from ERP |
| Inventory movement | GR/GI posting | ERP + WMS | Batch sync delays |

---

## BPMN Elements to Document

- [ ] Material availability check before order release
- [ ] Operator data collection method (terminal vs paper)
- [ ] Scrap/rework loop
- [ ] Handoff to warehouse (finished goods)

---

## Baseline Data Collection Questions

1. Average OEE by production line? [X%]
2. Changeover frequency per week? [N]
3. Manual production confirmations as % of total? [X%]
