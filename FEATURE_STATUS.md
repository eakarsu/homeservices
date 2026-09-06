# HomeServices feature review — September 6, 2026

This is a source and local-runtime assessment, not certification that every workflow works end to end. The application has a substantial foundation, but it is not complete or ready to describe as fully production validated. A page or API route alone is not evidence of a finished feature.

The original assessment below is historical. See the implementation checkpoint at the end for subsequent changes.

## What the screenshot shows

Login succeeded and the dashboard loaded fictional demo records. The local demo jobs span August 21–September 5; the paid demo invoices span August 12–26. Zero jobs today and zero September revenue are consistent with those records. The demo loader preserves existing dates and edits instead of advancing records each time it starts.

## Current implementation

| Area | Evidence and remaining limits |
| --- | --- |
| Customers, properties, equipment, jobs | Database models, UI, and API routes exist. Individual create/edit/permission workflows still need a full acceptance pass. |
| Dispatch, scheduling, technicians | Manual workflows exist. Dashboard job links include filters that the jobs page does not currently initialize from its URL. Technician profile ratings are hard-coded rather than backed by review records. |
| Estimates | Drafting, review, sending, approval tokens, signatures, versions, and audit code exist. The documented supported journey is reviewed estimate approval. |
| Invoices and payments | CRUD and Stripe integration code exist. Legacy public invoice/payment routes are disabled. Payment and webhook behavior still require provider test-mode validation. |
| Inventory and agreements | Parts, stock transfers, trucks, service agreements, and renewal routes exist. Purchasing needs a complete office workflow; a purchase-order data model already exists. |
| Follow-ups | Manual tasks, checklists, draft messages, and three AI drafting modes exist. Messages are saved as drafts; this feature does not send email or SMS. |
| AI quotes | The enabled endpoint requires a job and company-owned pricebook records, validates output, and saves provenance. Output requires human review. |
| Other advertised AI tools | Middleware blocks ten tools formerly linked from the AI catalogue, including diagnostics, scheduling, summaries, forecasts, photo intake, and route optimization. This applies locally as well as in production. |
| Accounting, fleet, payroll, marketplace, SMS and warranty “gap” routes | Generated routes contain generic prompt/history scaffolding, including mock fallbacks. They are disabled and do not constitute working integrations. |
| Launch readiness | Full role and tenant isolation, customer and technician acceptance, provider failure handling, backups/restore, and operational validation remain necessary. |

## Corrections made in this review

- Dashboard invoice revenue queries now constrain every period to the signed-in user's company and exclude future days.
- Dashboard and recent-job request failures show an error with a retry action instead of misleading zero totals or an empty list.
- The AI catalogue links to quote drafting and follow-ups, labels ten unfinished workflows unavailable, and removes hard-coded performance claims.
- Existing restrictions on unfinished routes remain in place.

## Proposed implementation order

“All possible features” has no finite completion point. The following is a concrete backlog to prioritize; these are proposed capabilities, not claims of implementation.

| Priority | Non-AI work | AI work | Completion evidence |
| --- | --- | --- | --- |
| 1. Finish current workflows | Verify customer → job → assignment → completion → estimate/invoice; fix deep-link filters, empty/error states, and role boundaries; remove fabricated profile metrics | Verify quote and follow-up drafts against real provider responses and failure cases | Browser acceptance for each supported role; cross-company access tests; saved changes survive reload; failures are visible |
| 2. Technician work | Clock in/out, timesheets, job photos, parts usage, checklists, customer signatures, office approval and CSV export | Draft work summaries from authorized job notes | No invented job evidence; times reconcile; office approvals recorded; drafts editable before saving |
| 3. Booking and communications | Booking requests, availability and conflict checks, cancellation/rescheduling, reminders, customer portal, delivery history and contact preferences | Intake extraction, customer message drafts, suggested booking slots | Timezone and concurrent-booking tests; customer access scoped; provider sandbox delivery and retry checks |
| 4. Purchasing and maintenance | Vendors, purchase orders, approvals, receiving, stock reconciliation, recurring maintenance visits and warranties | Reorder suggestions and maintenance review queues | Stock movements reconcile; partial receipts and returns work; recommendations cite underlying usage/history |
| 5. Dispatch and fleet | Map-provider integration, technician location consent, appointment windows and multi-technician jobs | Assignment and route suggestions | Scheduling constraints checked deterministically; dispatcher confirms assignments; missing location/provider data handled |
| 6. Finance and integrations | Complete payment portal, refunds, reconciliation, accounting sync, payroll exports and webhook retries | Invoice anomaly flags and margin explanations | Provider sandbox tests, duplicate webhook protection, per-company credentials and reconciliation reports |
| 7. Customer growth | Review collection, service-plan renewals, leads and referral tracking | Customer-history summaries and renewal/follow-up suggestions | Actual review data; contact restrictions honored; every proposed outreach reviewed |
| 8. Advanced tools | Supplier/fleet connections, subcontractor onboarding and warranty tracking | Photo extraction, voice transcription/intake, document search, diagnostics assistance | Configured providers, data authorization, source evidence, validated output and appropriate review before action |
| 9. Release readiness | Accessibility, mobile/offline behavior, monitoring, backups/restore, import/export, support procedures | Usage/cost visibility, provider timeouts, evaluation datasets and audit records | Representative user acceptance, deployment checks and a tested restore exercise |

Each feature should include persistent data, API validation, role/company permissions, a usable UI, error and retry behavior, and appropriate tests. External integrations also need the selected provider account and sandbox configuration. Sending messages, charging customers, purchasing, and publishing remain separate actions from implementing their software.

## Verification in this review

- TypeScript check passed.
- All 14 existing unit tests passed.
- The live dashboard API rejected unauthenticated access and returned revenue matching company-scoped reference queries for the one existing administrator account. This is not a multi-company regression test.
- Unfinished scheduling and generated accounting routes continued to return 404.
- The updated AI catalogue was inspected in the signed-in browser.
- A fresh demo login successfully returned to the dashboard with the expected job counts, revenue, and alerts.
- No database migrations, demo reseeding, external messages, or payment actions were performed for this review.


## Implementation checkpoint — September 6, 2026

The full checklist is **not complete**. New functionality is available through `/dashboard/operations`, `/dashboard/assistant`, the field-work panel on each job, and the private customer portal.

| Area | Implemented now | Remaining limits |
| --- | --- | --- |
| Booking and dispatch | Requests, confirmation into jobs, cancellation, office rescheduling, trade/hours/leave checks, serialized concurrent assignments, multi-technician window checks, stale versions and durable retry receipts. | External map routing, automatic reminders and broad device acceptance remain open. Existing legacy scheduling screens need further acceptance. |
| Technician work | Persistent private PNG/JPEG photos, stock-backed parts usage, checklists, recorded work, customer acknowledgement signatures and completion gates. Mobile detail now uses the persistent workflow. | Offline sync, media retention/storage scaling and native-device acceptance are unfinished. |
| Time and workforce | WORK/TRAVEL/BREAK timers, manual entries, overlap checks, office corrections, independent approval, retained approved time and CSV export; seven-day working hours and leave. | CSV is approved time, not calculated payroll or tax filing. Export currently covers the latest 1,000 entries. |
| Purchasing and stock | Vendors, draft PO lines with server-calculated totals, manager approval, partial receiving, warehouse returns, atomic transfers, reasoned adjustments and movement history. | Approval does not order from a supplier. Supplier ordering, accounts-payable matching and full inventory reconciliation remain open. |
| Customer access and growth | Expiring/revocable private portal grants, scoped visit requests/history/invoices, channel opt-outs, completed-job reviews, actual profile review aggregates, leads/referrals and customer conversion. | Full preference/consent history, broader customer acceptance and software billing remain open. |
| Office records | Maintenance intervals with explicit next-visit creation, warranty records, subcontractor credential references and approval, searchable company knowledge text. | These are internal workflows; they do not automatically verify licenses, submit warranty claims, order supplies or bill renewals. |
| AI workspace | 17 draft modes: summaries, diagnostics questions, intake/photo/audio, customer insights/messages, scheduling/dispatch/route suggestions, maintenance/agreement/renewal review, inventory, knowledge search, invoice anomalies and margin review. Actual authorized source snapshots, provider receipts/costs, request caps, budget reservations, retry protection, cancellation and hash-bound human review. | No live AI acceptance performed. Evidence-ID validation does not prove semantic correctness. Budget reservations are allowances, not a guarantee of provider charges. Knowledge intake is text; native document parsing and evaluations remain open. |
| Communications | Authorized drafts, approval, explicit sending through per-company encrypted Resend/Twilio settings, accepted/sent/delivered/undelivered history, current opt-out and approver checks, signed callbacks, callback replay and uncertain-outcome protection. | Tested with fixtures only. Accounts/senders/webhook endpoints require real configuration and provider acceptance. Unknown outcomes need reconciliation; they are not automatically resent. |
| Integrity and startup | Company transaction locks, durable retry receipts, request limits, audit events, reviewed job transitions, job retention, stock guards, company-timezone date boundaries and isolated authentication cookies. Startup preserves existing admin credentials and makes AI optional. | Full legacy-route and cross-role acceptance is still open. |

Verification at this checkpoint: 20 tests passed (14 existing unit tests plus 6 PostgreSQL integration scenarios). New scenarios exercise concurrent scheduling, tenant boundaries, receipt replay, stock/PO returns, job evidence and completion, timesheet approval, portal revocation, AI provider fixtures and signed messaging callbacks. An initial production build passed; the final build after AI/messaging changes and browser acceptance are still in progress.

Two additive migrations were applied. Before migration, a private PostgreSQL backup was saved and its archive catalog checked. No restore drill, real AI call, external message, payment, supplier order or deployment has been performed.

Finance/payment portal/refunds/accounting integration, map/fleet adapters and location consent, software subscriptions, offline behavior, full role acceptance, accessibility, monitoring, restore and deployment verification remain unfinished. The original generated gap routes stay disabled; the AI workspace provides reviewed drafts through its own validated API.

### Invoice and payment checkpoint — September 6

- Added reviewed invoice issue, draft editing, exact line/tax calculations, stale-version checks, immutable credit notes and retained void history. Client-supplied totals and arbitrary paid-status edits are rejected.
- Added received-funds confirmation for office cash/check/ACH records, manager cash refunds and Stripe refunds, cumulative refund limits and explicit credit-versus-balance-reopening behavior. Verified payment receipts are append-only; duplicate verified Stripe payment-intent IDs are rejected by the database.
- Added company Stripe checkout reservations, stable retry keys, uncertain-outcome holds, signed/bounded callback processing, exact receipt identity/amount/currency checks, manual provider reconciliation and checkout expiration. The customer portal and office invoice screen use this checkout.
- Added `/dashboard/finance` with refunds, provider receipts and displayed-receipt CSV export. Dashboard net receipts now exclude unverified legacy rows and credit notes, and subtract successfully settled refunds.
- Replaced the old invoice “send” simulation with a reviewable email draft in Communications. The old unsigned-capable Stripe webhook, permanent legacy job links, arbitrary invoice bulk status/delete, and unreconciled saved-card/recurring-billing endpoints are retired with explicit responses. Service-agreement billing and software subscriptions remain unfinished.
- Fixed a browser-discovered login hydration race: sign-in fields/buttons stay disabled until handlers are ready, and the form explicitly uses POST.

Validation: 22 tests passed (14 unit tests and eight PostgreSQL integration scenarios), including payment concurrency, repeat receipts, exact totals, cash refunds, credit balances, append-only constraints, forged/duplicate signed Stripe callbacks and unknown checkout outcomes. Production build passed after finance implementation; the final login hydration fix also passed the production build. Signed-in browser reads and rendering passed for booking, purchasing, time, workforce, messaging, AI, job work, finance, invoice detail and invoice creation. Anonymous protected requests returned 401. Invoice and finance screenshots were inspected.

Five additive implementation migrations are now applied after the initial backup: operations, assistant/delivery, invoice integrity, refund settlement and verified-payment retention. `./start.sh migrate` applies the additive SQL workflow instead of `prisma db push`, retaining the SQL guards. The local development server was restarted; configured demo loading ran and reported preserving existing rows.

Remaining finance limits: real Stripe test-account acceptance, accounting synchronization, recurring/saved-card billing, terminal hardware, chargeback handling, non-USD currency, manual check/ACH refund reconciliation and legacy invoice/receipt migration. Unknown provider requests must be reconciled; the UI does not invent payment success. No real provider charges, refunds, messages or AI calls were made.

### Full restore rehearsal — September 6

A fresh private custom-format PostgreSQL backup was restored into a disposable local database. Every public table was read, schema constraints were restored, and the restored database had zero invalid indexes. The disposable database was removed afterward. The backup is retained under `/Users/erolakarsu/.codex/backups/` in this project's directory as `restore-verified-*.dump` with owner-only file permissions. This supersedes the earlier archive-catalog-only checkpoint.

`npm run test:restore` repeats the backup and restore rehearsal against the configured local database. This verifies local restoration; off-site storage, retention scheduling, production disaster recovery and broader release acceptance remain separate work.

### Software subscription billing checkpoint — September 6

- Added an administrator-only `/dashboard/billing` page and company-scoped software subscription records. Operators configure the allowed Stripe price IDs and labels; the UI retrieves current prices and requires explicit recurring-price confirmation. Supported configured prices are fixed USD monthly/yearly plans with quantity one and reviewed tax mode.
- Software billing uses separate platform Stripe credentials, leaving company customer-invoice payment credentials scoped to their existing workflows. Saved checkout attempts enforce one outstanding request per company, stable customer/checkout parameters and provider retry keys, current administrator checks, uncertain-outcome holds and a 23-hour resend boundary. Provider references can reconcile or expire saved sessions. Stale interrupted RUNNING requests can recover after two minutes using the same provider key.
- Active paid status requires a current provider subscription and a paid invoice line matching its customer, subscription, configured price, quantity and current period. Return URLs do not activate plans. Signed callbacks retrieve current provider state under the company lock, validate authorized checkout metadata and retain replay hashes. Delayed callbacks cannot replace a different current subscription.
- The administrator can open the configured Stripe customer portal for invoice history, payment methods, supported plan changes and cancellation. Scheduled cancellation remains visible; expired paid periods do not report paid status. The provider portal configuration and real-account acceptance are still required. This adds billing state; per-plan feature quotas and a new application paywall are not imposed.
- Updated HomeServices to Next 15.5.25 / NextAuth 4.24.15 and patched vulnerable transitive dependencies. The final audit reports zero known vulnerabilities.

Validation: **26 tests passed** (14 unit checks and 12 PostgreSQL integration scenarios), including four new software-billing scenarios covering current-role and company access, price review, concurrent reservations, uncertain provider outcomes, recovery limits, signed callback replay, invoice-period identity, renewal, cancellation and immediate checkout completion. Type checking and the production build passed. After the additive migration and local restart, fresh browser login, authenticated API reads and all previously inspected operational pages passed again; the software subscription page rendered and its screenshot was inspected. Anonymous software billing access returned 401. No Stripe subscription, charge, refund or provider portal session was created in a real account.

Migration `20260906050000_software_billing` was applied after private backup `~/.codex/backups/homeservices/before-software-billing-1788724195046.dump`. Startup now checks for the software billing schema. Remaining major scope includes accounting synchronization, service-agreement recurring billing, real message/payment/map adapters and acceptance, consented fleet tracking, offline/native/device workflows, full role/legacy-route acceptance and the release checklist.

A fresh full restore rehearsal after the latest schema changes passed: 55 public tables, 176 constraints, zero invalid indexes, and successful reads of every restored table. Temporary restore databases were removed; private verified archives remain under this project's backup directory.
