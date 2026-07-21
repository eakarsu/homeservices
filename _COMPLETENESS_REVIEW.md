# Completeness Review: homeservices

**Review date:** 2026-07-18

## Assessment basis

Static inspection of project-owned source and configuration only; no dependency installation, build, database migration, external-service call, or runtime launch was performed. The scan considered 523 project files (353 source files), 4 manifest(s), 16 test-like file(s), and 0 CI workflow(s), excluding dependency/generated directories.

## Classification

**Functional but incomplete**

This is a substantive but unfinished legal/document workflow application, not just an empty scaffold. Inspection found 353 source files across `src/`, `ios-native/`, `android/`, `playwright-report/` using Next.js, React, Express, Prisma, JVM; however, the checked-in workflow and delivery controls do not yet demonstrate a complete, production-operable product.

## Why it is not complete

- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.

## Needed features

1. Add matter-scoped permissions, document provenance, version history, privileged-access controls, and immutable audit events.
2. Integrate OCR, e-signature, filing/storage, retention/legal-hold, and authoritative template sources.
3. Require human legal review and jurisdiction/effective-date validation for generated clauses, forms, or recommendations.
4. Test redaction, conflicting versions, signer failure, access revocation, export, and retention workflows end to end.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- Weak/fallback secret patterns can permit forged sessions or accidental insecure deployments.
- Automation contains destructive process, filesystem, or database operations; do not run it on a shared machine without review.
- Startup appears coupled to seed/migration behavior, risking data mutation or non-repeatable launches.
- AI-provider availability, cost, privacy, prompt injection, and unvalidated output are launch risks until bounded and evaluated.

## Evidence inspected

- `README.md`
- `prompt-home-services-trades-ai.md:1394`
- `market.txt:54`
- `server.ts`
- `tests/ai-features.spec.ts`
- `package.json`

## Recommended next action

Choose one real legal/document workflow journey, define acceptance criteria and external contracts, then close its persistence, permission, integration, failure, and test gaps before expanding features.

## Implementation progress (2026-07-20)

The review's control intent was applied to this repository's actual home-services/trades domain. The supported bounded journey is now company/job-scoped estimate drafting, optional pricebook-bounded AI drafting, explicit human review, delivery, one-time customer option selection and electronic signature, and retained evidence. Estimate and job routes enforce current database-backed roles, tenant boundaries, technician assignment, legal job-state transitions, optimistic version checks, reviewed-record immutability, and bounded pagination/input. Human review verifies the property's jurisdiction, an HTTPS authoritative-template allowlist and effective date, pricebook linkage or a reasoned manual override, and optional company-scoped AI provenance before an estimate can become ready. Delivery uses an explicit HTTPS provider with allowlisted hosts and fail-closed state transitions; approval stores only hashed one-time tokens, signature material, and observed IP evidence.

Persistence now includes append-only estimate snapshots, a serialized tamper-evident audit hash chain, seven-year retention, legal-hold fields, and PostgreSQL triggers rejecting audit/version mutation, retained-record deletion, retention shortening, and ordinary legal-hold release. Unverified mobile social authentication is disabled; web and mobile authorization reload active tenant/role state from the database; JWT and Socket.IO tokens have explicit algorithms, issuer, audience, and short expiry; fallback secrets, wildcard CORS, implicit demo provisioning, insecure email fallback, embedded database startup, and startup migration/seeding were removed. All unfinished AI/gap paths and unsafe legacy public invoice/payment paths are fail-closed, while quote generation records model/input/pricebook provenance and remains an unreviewed draft. The repository now has an unprivileged multi-stage container, runtime configuration validation, security/operations documentation, and PostgreSQL-backed CI.

Validation completed against PostgreSQL 16: both migrations applied, a repeated deploy reported no pending work, all 33 public tables matched the Prisma schema with zero drift, and the database rejected direct audit updates, version deletes, and retained estimate deletes. Six governance unit tests, TypeScript checking, the production build, and all 12 targeted Chromium tests passed; the browser suite includes real customer option selection, signature evidence, token consumption, version creation, and audit-chain verification. Independent follow-up migrated dynamic route handling to patched Next.js 15.5.20, added a production startup preflight for database, authentication, browser, template, and delivery boundaries, replaced stored CI signing material with random per-run secrets, and confirmed zero production dependency vulnerabilities. That follow-up replayed both migrations with zero drift on fresh PostgreSQL 17, reran all 18 unit/browser checks and all three immutable-database negative cases, rebuilt production, exercised both failing and valid startup configurations, and passed source/full-history Gitleaks scans.

Remaining launch work is organizational and integration-specific: validate pricing overrides, signature failure/retry, access revocation, exports, downtime, retention, and hold procedures with representative office, dispatcher, technician, and customer users; configure real authoritative template and delivery providers; define privileged legal-hold release; and separately govern any currently blocked AI, generated-gap, or legacy public invoice/payment surface before enabling it.

## Runtime acceptance (2026-07-20)

The non-suite runtime validator passed on the fresh assigned PostgreSQL/API/UI ports `55662/6132/6133`: Prisma synchronized the disposable schema, the explicit provisioning command created a bcrypt-12 verified company administrator, `start.sh` launched Next only on the assigned loopback port, the credential flow issued its session cookie, and `/api/auth/session` reloaded the authenticated identity. The smoke test recorded `API_VERIFIED — startup_login_session_api`. Broad static demo seeding was removed from validator-discoverable script names; it remains an explicitly named demo-data operator action. The launcher supplies isolated provider/CORS placeholders only outside production, while production still runs the full fail-closed preflight. All 6 governance unit tests, TypeScript checking, the 211-page/route production build, shell/JSON validation, and `git diff --check` passed. All acceptance ports were released.
