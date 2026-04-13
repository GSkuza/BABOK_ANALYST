# BABOK Analyst – Industry Knowledge Base

This directory contains structured knowledge files for the BABOK Analyst agent. The knowledge base provides real-world reference data for business analysis projects in mid-market manufacturing, distribution, and services companies.

## Directory Structure

```
knowledge/
├── industries/          # Industry profiles with processes, KPIs, pain points
├── regulations/         # Regulatory compliance requirements and checklists
│   └── einvoicing/     # E-invoicing mandates by country
├── benchmarks/          # Quantitative benchmark data with cited sources
├── technology/          # Technology comparisons and architectural patterns
├── anti_patterns/       # Common mistakes and corrections for BAs
├── schema/              # JSON Schema v7 files for validation
└── README.md
```

## Knowledge Files

### Industries (`industries/`)
| File | Description |
|------|-------------|
| `manufacturing.json` | Discrete/process manufacturing – P2P, O2C, MRP, quality, maintenance processes; OEE, invoice, inventory KPIs |
| `distribution.json` | Wholesale/3PL distribution – inbound logistics, order management, inventory, transport KPIs |
| `services.json` | Professional services – project delivery, time & billing, knowledge management, utilization KPIs |

### Regulations (`regulations/`)
| File | Description |
|------|-------------|
| `gdpr_checklist.json` | EU GDPR (Reg. 2016/679) – 16 articles, 20-item compliance checklist, penalty ranges |
| `iso27001.json` | ISO/IEC 27001:2022 – ISMS requirements, 93 Annex A controls summary, certification guidance |
| `einvoicing/poland_ksef.json` | KSeF mandatory e-invoicing (Poland) – FA(2) XML, API integration, UPO storage, penalties |
| `einvoicing/germany_xrechnung.json` | XRechnung/ZUGFeRD (Germany) – B2G/B2B requirements, Leitweg-ID, GoBD archiving |

### Benchmarks (`benchmarks/`)
| File | Sources | Data Points |
|------|---------|-------------|
| `document_automation.json` | Ardent Partners, Gartner, AIIM, McKinsey | 18 data points: AP cost/time, OCR accuracy, ROI |
| `erp_implementation.json` | Panorama Consulting, Gartner, Nucleus Research | 15 data points: cost, duration, failure rates, TCO |
| `process_optimization.json` | Deloitte, McKinsey, Forrester, Prosci | 15 data points: RPA ROI, BPM value, automation potential |

### Technology (`technology/`)
| File | Description |
|------|-------------|
| `dms_comparison.json` | SharePoint, M-Files, DocuWare, OpenText – features, pricing, GDPR compliance |
| `erp_landscape.json` | SAP Business One, MS Dynamics 365 BC, Epicor, NetSuite, Infor – TCO, fit by industry |
| `integration_patterns.json` | 6 integration patterns: Point-to-Point, Hub-and-Spoke, Event-Driven, API Gateway, EDI/SFTP |

### Anti-Patterns (`anti_patterns/`)
| File | Count | Description |
|------|-------|-------------|
| `requirements_mistakes.json` | 12 | Gold-plating, vague requirements, scope creep, missing NFRs |
| `roi_calculation_errors.json` | 8 | Hidden costs, double-counting, adoption rate errors, marginal vs. full cost |
| `stakeholder_pitfalls.json` | 8 | Late identification, ignoring end users, conflict avoidance |

## Usage via knowledge-loader.js

```javascript
import { loadKnowledge, getRelevantKnowledge, formatKnowledgeForPrompt } from './cli/src/lib/knowledge-loader.js';

// Load a specific file
const manufacturing = loadKnowledge('industries', 'manufacturing');
const ksef = loadKnowledge('regulations', 'einvoicing/poland_ksef');

// Get relevant knowledge for a project context
const knowledge = getRelevantKnowledge({
  industry: 'manufacturing',
  regulations: ['gdpr', 'ksef', 'iso27001'],
  benchmarks: ['document_automation', 'erp_implementation'],
  technology: ['dms_comparison', 'erp_landscape']
});

// Format for LLM prompt injection (truncated to token limit)
const prompt = formatKnowledgeForPrompt(knowledge, 4000);
```

## Regulation Key Mappings

The `getRelevantKnowledge` function accepts these short-form regulation keys:

| Short key | Maps to file |
|-----------|-------------|
| `gdpr` | `regulations/gdpr_checklist.json` |
| `iso27001` | `regulations/iso27001.json` |
| `ksef` | `regulations/einvoicing/poland_ksef.json` |
| `xrechnung` | `regulations/einvoicing/germany_xrechnung.json` |

## JSON Schema Validation

Schemas are in `schema/` and follow JSON Schema Draft-07:

```bash
# Validate with ajv-cli
npx ajv validate -s knowledge/schema/industry.schema.json -d knowledge/industries/manufacturing.json
npx ajv validate -s knowledge/schema/regulation.schema.json -d knowledge/regulations/gdpr_checklist.json
npx ajv validate -s knowledge/schema/benchmark.schema.json -d knowledge/benchmarks/document_automation.json
```

## Data Quality Standards

All benchmark data points include:
- **Source**: Named analyst firm, research organization, or vendor study
- **Year**: Publication year (2023 or 2024 for current data)
- **Context**: Applicability (mid-market, EU, specific industry where relevant)

Anti-pattern entries include:
- **Symptoms**: Observable indicators that the anti-pattern is occurring
- **Correction**: Specific remediation steps with BABOK framework references

## Contributing

When adding new knowledge files:
1. Validate JSON syntax before committing
2. Validate against appropriate schema in `schema/`
3. For benchmark data: only include data with verifiable sources
4. For regulations: include article/section references for all requirements
5. Update this README with new file descriptions
