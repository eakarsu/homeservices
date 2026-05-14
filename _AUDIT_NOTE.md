# Audit Apply Notes — homeServices_salesforce

Source: `_AUDIT/reports/batch_10.md` § Substantive #14 homeServices_salesforce

## Original audit recommendations

Audit verdict: **SUBSTANTIVE** — 112 pages + 82 API routes. Already an enterprise field-service platform (ServiceTitan/Housecall Pro competitor) with quote generation, dispatch optimization, route optimization, smart scheduling, predictive maintenance, photo-based diagnostics, inventory forecasting, etc.

### What's missing
- Real-time job state collaboration (multi-tech jobs)
- Automatic warranty claim processing
- Parts supply chain integration (auto-order consumables)
- Performance-based technician pay calculation
- Competitor pricing intelligence
- Customer review automation (post-job feedback survey)

### Custom feature ideas
- Technician quality/safety agent
- Customer lifetime value optimizer
- Predictive supply chain
- Voice-first job intake
- Territory optimization agent

## Implemented this pass

**None.** This pass is backlog-only.

Reason: as for `healthcare_salesforce`, the recommendations are infrastructure-scale (real-time collaboration backplane, supply-chain integrations, telephony for voice intake). The constraints disallow new SDKs / frontend changes, and the existing 82 AI endpoints already cover the conversational review and recommendation flows. Adding any of the audit's custom ideas would require schema and integration decisions, not a single-file route addition.

## Backlog (not implemented)

### Needs creds / external deps
- Parts supply-chain integration (HD Supply, Ferguson, Grainger).
- Voice-first job intake (Twilio Voice or equivalent).
- Competitor pricing intelligence (price-monitoring vendor).

### Needs schema/data model work
- Multi-technician live job state (presence + state-CRDT or similar).
- Warranty claims state machine.
- Performance-based tech pay (variable comp ledger).
- Post-job survey channel + response aggregation.

### Needs product decision
- Technician safety agent — escalation policy and BWR (body-worn-recorder) decisions.
- Customer LTV optimizer — segmentation policy and offer engine constraints.
- Territory optimization — fairness criteria.

## Categorisation

- MECHANICAL: none safely identified given recommendations are infrastructure-scale.
- NEEDS-CREDS: supply-chain, telephony, price-monitoring.
- NEEDS-SCHEMA: collaboration backplane, warranty, comp ledger, survey aggregation.
- NEEDS-PRODUCT-DECISION: safety agent policy, LTV segmentation, territory fairness.

## Apply pass 3 (frontend)

Action: LEFT-AS-IS — frontend already wired to backend AI endpoints with JWT Bearer auth from localStorage. No idempotent changes required. See `_AUDIT/apply3_logs/ab3_66.md`.

## Apply pass 4 (mechanical backlog)

Action: NO-OP. As recorded in the original notes, every recommended addition is infrastructure-scale (real-time collaboration backplane, supply-chain integrations, telephony) and falls into NEEDS-CREDS / NEEDS-SCHEMA / NEEDS-PRODUCT-DECISION categories. No mechanical single-file LLM-helper additions are appropriate. The existing 82 AI endpoints already cover review/recommendation flows.
