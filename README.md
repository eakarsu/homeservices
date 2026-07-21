# ServiceCrew home-services operations

The supported high-risk journey is company/job-scoped estimate drafting → optional pricebook-bounded AI draft → human scope/jurisdiction/template/price review → one-time email delivery → customer option selection and electronic signature → immutable version and audit evidence.

AI quote output is always an `UNREVIEWED_DRAFT`. It requires an accessible job plus active company-owned pricebook items, deterministic arithmetic/variance checks, input/model/source provenance, and a separate human review attestation before it can be delivered. Provider failure never fabricates sample pricing. Generated gap routes and other unreviewed AI routes are unavailable in production middleware.

Technicians can access only assigned jobs. Office roles remain company scoped, job state changes follow an explicit transition graph, and completion requires work-performed evidence plus customer signature. Socket rooms require a five-minute authenticated token and re-check job/company/technician scope before joining.

## Setup

```bash
npm ci
cp .env.example .env
# Set a random 32+ character NEXTAUTH_SECRET and every required endpoint/allowlist.
npx prisma migrate deploy
npx prisma generate
npm run build
npm start
```

Startup does not install packages, kill processes, create/reset/seed a database, or mutate schema. Seeding is an explicit development/test action. The unprivileged application container uses an external PostgreSQL service and does not contain a database server.

## Verification

```bash
npx prisma validate
npm run test:unit
npm run typecheck
npm run build
npm test -- tests/auth.spec.ts tests/estimate-approval.spec.ts
npm audit --omit=dev --audit-level=low
```

CI applies both migrations to PostgreSQL 16, rejects schema drift, seeds test data, runs governance tests, type-checks, builds, exercises authentication plus one-time estimate approval in Chromium, verifies database immutability/retention failure paths, rejects every production dependency advisory, and scans full Git history for secrets. CI generates its authentication secret for every run.

See `SECURITY.md` for role boundaries, audit-chain verification, retention/hold operations, and incident response. Production launch still requires representative dispatcher, technician, office, and customer validation of pricing overrides, signature failure/retry, access revocation, export, downtime, retention, and hold procedures.
