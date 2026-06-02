# Competitive Landscape

> **Last updated:** 2026-04-05
> **Owner:** Customer Success
> **Status:** Initial draft — expand with customer evidence over time

DocuStract is "a better docupipe.ai" — a document processing pipeline built REST-first. This document maps the competitive landscape from the customer perspective.

---

## Competitor Profiles

### 1. DocuPipe

**Overview:** AI-powered document extraction platform. Claims to process 1B+ pages. Targets Finance, Healthcare, Logistics, Real Estate.

**Strengths customers cite:**
- High accuracy on structured docs (invoices, forms)
- HIPAA and SOC 2 certified — critical for healthcare and finance
- Handles handwriting, multi-language, complex tables
- Strong API via docupipe.readme.io

**Weaknesses customers cite / known gaps:**
- No transparent public pricing — requires sales contact for enterprise tiers
- Complex setup for custom document types
- API-first but not REST-idiomatic; feels like legacy integration
- No transparent self-serve pricing, making it hard for small teams to try

**Pricing:** Free tier (300 credits). Enterprise: opaque, sales-led.

**Recent moves:** Positioning heavily on compliance (HIPAA, SOC 2) as differentiator.

---

### 2. Rossum

**Overview:** AI document processing with autonomous agents. Integrates directly into ERP systems (SAP, NetSuite, Workday, Coupa). 276-language support including handwriting.

**Strengths customers cite:**
- Best-in-class ERP integrations out of the box
- 95% time savings per document (Morton Salt case study)
- Low training burden — 92.6% accuracy after 20 documents (Adyen case study)
- Autonomous agents handle full document lifecycle

**Weaknesses customers cite / known gaps:**
- Enterprise pricing only — no accessible self-serve tier
- Configuration complexity; heavy professional services involvement
- Overkill for simple pipelines; designed for high-volume transactional flows
- No transparent API-first story; integrations-first rather than developer-first

**Pricing:** 14-day trial. No public pricing. Enterprise only.

---

### 3. AWS Textract

**Overview:** ML-powered OCR and document extraction, fully integrated into AWS ecosystem.

**Strengths customers cite:**
- Scales instantly with AWS infrastructure
- No ML expertise required
- Customizable for domain-specific documents
- Strong for teams already in AWS

**Weaknesses customers cite / known gaps:**
- Steep learning curve for non-AWS-native teams
- Requires significant configuration per document type
- Output is raw; significant post-processing needed for structured data
- Lock-in to AWS; expensive at scale without careful planning
- Not a complete pipeline — requires additional services for routing/transform

**Pricing:** Pay-per-page. Can become expensive at volume without cost controls.

---

### 4. Azure Document Intelligence

**Overview:** Part of Microsoft Fabric/Foundry ecosystem. ML-based extraction from forms, PDFs, images.

**Strengths customers cite:**
- Good accuracy on standard form layouts
- Pre-built models for invoices, receipts, IDs
- Microsoft ecosystem integration (Teams, Power Platform, Dynamics)
- Custom model training available

**Weaknesses customers cite / known gaps:**
- Significant Azure lock-in
- Complex to configure for non-standard documents
- JSON output requires post-processing to fit into most pipelines
- No strong developer experience story for non-Microsoft shops

**Pricing:** Pay-per-document with per-feature pricing. Moderate transparency.

---

### 5. Nanonets

**Overview:** OCR + ML hybrid with human-in-the-loop. Handles structured, unstructured, and semi-structured documents.

**Strengths customers cite:**
- Self-improving ML models
- Human-in-the-loop reduces error rate on edge cases
- No template dependency — adapts to new document formats
- Good for diverse document types

**Weaknesses customers cite / known gaps:**
- No transparent pricing — enterprise quotes only
- Training overhead — needs initial dataset
- Human review layer adds latency and cost
- Not API-first; platform-centric experience

**Pricing:** Free trial. Enterprise: contact sales.

---

## Competitive Summary

| Competitor       | Pricing Transparency | API-First | Self-Serve | Developer DX | Compliance Ready |
|-----------------|---------------------|-----------|------------|-------------|-----------------|
| DocuPipe        | Low (free tier)     | Partial   | Partial    | Moderate    | Yes (HIPAA/SOC2)|
| Rossum          | None (enterprise)   | No        | No         | Low         | Yes            |
| AWS Textract    | Medium (pay-per-use)| Yes       | Yes        | Moderate    | Via AWS        |
| Azure Doc Intel | Medium             | Yes       | Yes        | Moderate    | Via Azure      |
| Nanonets        | None (enterprise)   | Partial   | Partial    | Moderate    | Moderate       |
| **DocuStract**  | **High (open)**    | **Yes**   | **Yes**    | **High**    | **TBD**        |

---

## Win/Loss Patterns

### Why customers will choose DocuStract

1. **REST-native from day one** — not bolted on. Developers get idiomatic endpoints, not a wrapped legacy API.
2. **Transparent pricing** — no sales call required to know what you'll pay.
3. **Lightweight** — smaller teams can self-serve without professional services.
4. **Modern stack** — TypeScript REST API foundation signals maintainability.

### Why customers will choose competitors

- **Compliance needs (HIPAA/SOC2):** DocuPipe or Rossum right now — DocuStract must earn this trust.
- **Deep ERP integration:** Rossum wins on SAP/NetSuite out of the box.
- **Cloud scale without ops:** AWS Textract / Azure DI when already in those clouds.
- **High volume, low diversity:** Competitors with pre-built models for invoices/receipts need less configuration.

---

## Feature Gaps (DocuStract vs. Market)

1. **No pre-built document type models** — competitors offer ready-to-use extractors for invoices, receipts, IDs. DocuStract starts from scratch.
2. **No compliance certifications** — HIPAA, SOC 2, GDPR compliance story is absent. Required for healthcare and regulated industries.
3. **No human-in-the-loop** — competitors like Nanonets offer review workflows for edge cases.
4. **No ERP connectors** — Rossum owns this space. DocuStract has no integration story.
5. **No multi-language / handwriting support** — explicitly offered by DocuPipe and Rossum.

---

## Retention Risks

- DocuPipe's compliance certifications are a significant moat. Without HIPAA/SOC2, DocuStract cannot compete for healthcare/regulated-industry customers.
- Rossum's ERP integrations are sticky — once in SAP, hard to migrate.
- If AWS/Azure lower pricing, the managed-playbook advantage shrinks.

---

## Action Items for Product

| Priority | Action | Rationale |
|----------|--------|-----------|
| High     | Define compliance roadmap (GDPR → SOC 2 → HIPAA) | Block on regulated-industry deals |
| High     | Build self-serve pricing page with clear tiers | Eliminates #1 friction for new signups |
| Medium   | Add pre-built invoice/receipt extraction model | Reduces time-to-value vs. competitors |
| Medium   | Document REST API idioms and DX story | Lean into our primary differentiator |
| Low      | Explore ERP connector roadmap | Long-term Rossum defense |

---

_This document is a living competitive intelligence resource. Update when new customer evidence, competitor moves, or pricing changes are observed._
