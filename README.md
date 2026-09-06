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

Startup does not install packages or kill unrelated processes. Demo seeding is opt-in: set `LOAD_DEMO_DATA=true` for a local development database, or run `npm run demo-data:load` explicitly. The loader uses the existing administrator company, inserts missing sample records, and preserves existing records and edits. Production seeding is disabled. The unprivileged application container uses an external PostgreSQL service and does not contain a database server.

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

## Local sample data

`npm run demo-data:load` loads the company belonging to `DEMO_DATA_ADMIN_EMAIL`, `ADMIN_EMAIL`, or `BOOTSTRAP_ADMIN_EMAIL`. Create that administrator first with `npm run create-admin`. The loader uses the configured local database and requires a development environment and a demo/admin password of at least 12 characters.

The dataset includes 15 customers, properties, equipment items, technicians, trucks, service types, agreement plans, estimates, inventory parts, pricebook items, service agreements, purchase orders, payments, timesheets and internal customer notes, plus 30 jobs and 30 invoices. Related records include truck stock, job assignments, service history, estimate options and line items. Sample records are labeled Demo; contact details use example.invalid and fictional phone numbers. Estimates remain drafts, and seeded payment entries are explicitly simulations. AI execution history is populated only by actual AI calls.

The active local configuration enables `LOAD_DEMO_DATA=true`. Set it to false to stop filling missing sample rows at startup. Rerunning the loader does not duplicate rows, overwrite edits, or change the administrator’s company. Collection views unwrap paginated API responses and load every page for their local search and filters.

## Customer follow-ups

Open **Follow-ups** in the office sidebar (`/dashboard/follow-ups`). Create customer/job-linked tasks, assign staff, set due dates, edit checklists, search, filter overdue tasks, and complete or cancel work. Completion requires every checklist item to be checked. Updates reject stale versions; saves record an audit event. Technician accounts cannot manage office follow-ups.

Three separate OpenRouter buttons prepare a customer message, a checklist, or all draft fields (title, internal notes, message and checklist). Review and edit before saving. AI output is validated, saved with its model in AIResult, and linked to the task. Contact restrictions remain visible. No email/SMS is sent by this feature.

The demo loader adds 15 clearly labeled follow-ups without duplicating or overwriting existing work. New databases get `20260905000000_follow_up_tasks` through `prisma migrate deploy`. Existing installations created with the older manual SQL startup can apply this additive migration once with:

```sh
npx prisma db execute --file prisma/migrations/20260905000000_follow_up_tasks/migration.sql --schema prisma/schema.prisma
npm run db:generate
```

Restart the app after generating the client. The explicit `ALLOW_SCHEMA_MIGRATION=1` startup path also applies the follow-up migration when its table is absent. Never reset an existing database to install this feature.

Verification: unit tests cover invalid AI content, role/origin checks, and completion validation. Local browser checks covered all three live OpenRouter actions, manual edits, saving, completion, reload persistence, filters, and mobile layout.

When running the portfolio locally, include `connection_limit=2&pool_timeout=30`
in the PostgreSQL `DATABASE_URL` query parameters to keep simultaneous apps from
exhausting the shared database connection limit. Restart after changing .env.


## Operations workspace

Use `/dashboard/operations` for bookings, working hours/leave, timesheets, purchasing, stock history, customer access links, communications and office records. Each job now has a field-work panel for private photos (PNG/JPEG, up to 1 MB), parts usage, checklists, work notes and customer acknowledgement. Close timers and complete the checklist before completing a job. Approved timesheet CSVs contain time records; they do not calculate wages or taxes.

Purchase-order approval is an internal decision. Record physical receipts and returns explicitly; the application does not place supplier orders. Portal links expire and can be revoked; they are shown privately and are not emailed automatically. Customers can request/cancel visits, change contact preferences and review completed jobs. Confirmed rescheduling requires the office.

`/dashboard/assistant` provides 17 source-based drafting modes. Configure OpenRouter on the server to generate text/photo/audio drafts. The app stores evidence snapshots, model receipts, reported costs and human review. It limits requests, reserves a configurable allowance per request and keeps uncertain outcomes from automatically retrying. Configure a provider-side spending limit as well; the local allowance is not a promise of actual charges. Existing quote/follow-up drafting has separate controls.

Resend and Twilio settings are per company in Operations → Integrations. Set a private 32-byte hexadecimal `INTEGRATION_ENCRYPTION_KEY` before saving credentials. Resend uses a verified sender and webhook signing secret. Twilio uses an Account SID, auth token and sender number; SMS needs a public HTTPS app origin. Configure callbacks at `/api/integrations/messages/COMPANY_ID/resend` or `/api/integrations/messages/COMPANY_ID/twilio`. Draft, review and explicitly send each message. Accepted status means a provider accepted the request; delivered status requires provider evidence. Uncertain outcomes must be reconciled before any resend. Provider fixtures pass, but live sandbox acceptance is not yet complete.

Run `npm run test:operations:isolated` with local PostgreSQL to create a disposable database, apply migrations, run the unit/integration checks and drop the test database. It never tests against the application database. Back up an existing database before enabling migrations. Startup preserves an existing administrator and makes AI optional; old sessions require a fresh login after the cookie namespace changes. Demo credential autofill requires an explicit non-production opt-in.

See `FEATURE_STATUS.md` for the verified scope and remaining work. A backup archive has been checked, but a restore drill and production acceptance are still pending.

### Reviewed invoice and payment workflows

Create and edit invoices under **Invoices**, then have a manager review and issue them. The server calculates lines and tax. Preparing an invoice email creates a draft under **Operations → Communications**; delivery requires its separate review and explicit send action.

**Payments & refunds** contains manager refund actions, unresolved checkout/refund records and provider reconciliation. Configure the company Stripe secret and webhook secret under **Operations → Integrations** and register `/api/integrations/stripe/{companyId}` with Stripe. Customer portal links use `/portal#TOKEN` and expire or can be revoked. A checkout return page alone never marks an invoice paid.

Office cash/check/ACH receipts require confirmation of actual receipt. Credits reduce the amount owed; refunds without a credit reopen that amount. Historical unverified payments remain visible but are excluded from dashboard net receipts. Recurring agreement billing and saved-card management are not yet supported by the reconciled workflow.

See `FEATURE_STATUS.md` for tested scope and unfinished work. For existing local schemas, back up first and use `ALLOW_SCHEMA_MIGRATION=1 ./start.sh migrate`; this applies the additive SQL migrations and preserves their database guards. Avoid `prisma db push` against a database containing these guard triggers and partial indexes.

Run `npm run test:restore` to create a private backup, restore it into a disposable local PostgreSQL database, and read all restored public tables. It requires local PostgreSQL tools and permission to create a temporary database. The backup remains under `~/.codex/backups/<project>/`; the temporary database is removed after the check. The September 6 full restore rehearsal passed.

### Company software subscription billing

Company administrators can open **Software subscription** to inspect billing status, load configured recurring prices, continue a saved checkout, reconcile provider receipts and open the configured provider billing portal. Paid status requires a verified current subscription and paid invoice; a checkout return does not activate it.

Configure these separately from each company's customer-invoice payment credentials:

- `SOFTWARE_STRIPE_SECRET_KEY`: the platform software-billing Stripe account key.
- `SOFTWARE_BILLING_PLANS`: JSON such as `[{"key":"team","label":"Team","priceId":"price_yourConfiguredPrice"}]`. Use actual fixed USD monthly/yearly Stripe prices, with unique keys and price IDs. Prices are read from Stripe; no amount is invented locally.
- `SOFTWARE_BILLING_TAX_MODE`: `automatic` for configured Stripe Tax, or `none-reviewed` after the operator has reviewed that setup. Checkout is disabled until this is explicit.
- `SOFTWARE_STRIPE_PORTAL_CONFIG_ID`: the reviewed `bpc_…` portal configuration. Limit plan changes to the configured catalog and quantity one; enable the desired invoice/payment-method/cancellation capabilities in Stripe.
- `SOFTWARE_STRIPE_WEBHOOK_SECRET`: signing secret for `/api/software-billing/webhook`. Configure subscription created/updated/deleted, invoice paid/payment failed and checkout completed/asynchronous payment succeeded events using API version `2025-02-24.acacia`.

Use HTTPS deployment URLs. Local localhost/127.0.0.1 checkout-return URLs are supported for account testing. Provider acceptance remains outstanding; local tests use fixtures. Unknown requests preserve the same checkout; after 23 hours, use a provider reference for reconciliation instead of resending. Do not change the platform account behind existing subscriptions without migrating verified customer/subscription bindings. The integration follows Stripe's [subscription retrieval](https://docs.stripe.com/api/subscriptions/retrieve?api-version=2025-02-24.acacia) and [customer portal](https://docs.stripe.com/customer-management/integrate-customer-portal) APIs.

Local restart behavior: `./start.sh` clears this project’s configured ports before migrations or builds. It stops the prior project server tree, waits for release and verifies the ports are free. If another application owns a configured port, startup stops with an explanation instead of terminating that application. Run `npm run test:startup` to verify both cases.

Local autofill is enabled by `ENABLE_DEMO_CREDENTIAL_AUTOFILL=true` in the ignored `.env`, with the existing administrator credentials configured there. The login button checks availability without retrieving passwords, then fills the configured account when clicked. Availability and credential responses are never cached.
