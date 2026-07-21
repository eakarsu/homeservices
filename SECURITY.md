# Security and records operations

## Access and privileged operations

- Every API derives company and role from a validated current user record. Mobile JWTs require HS256, issuer/audience checks, a non-placeholder 32+ character secret, and a 12-hour expiry; inactive or moved users are rejected even when an older token is otherwise valid.
- Office roles can view company jobs. Technicians can view/edit only assigned jobs and only execution fields. Estimate authoring/review/delivery is limited to admin, manager, and office roles.
- OAuth identities must be pre-provisioned. Web OAuth does not create companies/admins, and the legacy mobile endpoint that trusted unverified provider assertions is disabled.
- Socket clients obtain a five-minute audience-bound token from `/api/socket-token`; every room join is checked against company ownership and assignment.

## Estimate evidence and audit

Every draft/edit/review/delivery/signature transition writes an immutable `EstimateVersion` snapshot and a hash-chained `AuditEvent` in the same transaction. Company-row locking serializes writers so the chain cannot fork. PostgreSQL triggers reject updates/deletes of either table.

Customer approval links contain 256 bits of randomness; only SHA-256 hashes are stored. Links are one-time and expire at the earlier of seven days or the estimate expiration. Approval captures the exact option/amount, attestation, signer name, timestamp, signature hash, user agent, and a hash of the observed IP. Raw signature material and raw IP addresses are not retained in audit evidence.

Human review requires the service-property jurisdiction, an HTTPS authoritative template URL on `TEMPLATE_ALLOWED_HOSTS`, a non-future effective date, and a detailed override reason for manual/stale/non-pricebook pricing. AI provenance may be attached only from a successful company/job-scoped quote result.

## Retention and holds

Estimates default to seven years of retention. The database prevents deletion during retention, shortening the retention date, deleting historical versions, and releasing an active hold through ordinary application writes. A deployment must define jurisdiction-specific schedules and a separate dual-control hold-release procedure with legal/records owners before production. Backups must expire consistently after all holds and contractual requirements end. Never delete operational records to correct them; create a superseding version or decline/expire the record.

## Delivery and secret handling

Email uses an HTTPS provider endpoint with an explicit hostname allowlist, bounded timeout, and bearer token. Delivery failure returns the estimate to `READY` for controlled retry; no development log fallback claims success or prints approval/reset tokens. Production requires HTTPS application/CORS origins and explicit template/email hosts.

## Incident response

1. Contain the affected user, token, connector, or host without altering audit/version records.
2. Notify the designated security and records owners; record detection time, companies, customers, data classes, and systems.
3. Revoke sessions, rotate affected credentials, disable unsafe integrations, and preserve forensic snapshots and relevant logs.
4. Verify each company's audit hash chain and identify unauthorized access, pricing, delivery, signature, export, or hold changes.
5. Follow contractual, insurance, payment, privacy, and jurisdictional notification requirements; document decisions.
6. Restore from verified state, monitor for recurrence, and test corrective actions plus downtime procedures.

## Dependency advisory tracking

As of 2026-07-20, the application is migrated to patched Next.js 15.5.20 and `npm audit --omit=dev --audit-level=low` reports zero vulnerabilities. CI rejects any production dependency advisory at low severity or higher, creates test signing material per run, and scans the complete Git history for secrets. Do not waive a future security advisory without an owner, expiry, compensating controls, and documented production approval.
