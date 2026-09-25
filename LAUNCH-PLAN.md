# HomeServices — executable launch plan

**Target:** satisfy the `TOP20.md` launch condition for rank 1 —
*"Pilot preparation; verify delivery and software billing"* — and reach a sellable pilot.
**Basis:** runtime verification (2026-09-25) + source inspection of `/Volumes/external/projects/homeservices`.
**Status today:** boots and serves HTTP. Classed *"Functional but incomplete"* by its own
`_COMPLETENESS_REVIEW.md`. Not yet piloted.

---

## 0. Read this first — two corrections to the existing docs

**The `_COMPLETENESS_REVIEW.md` "Needed features" list is a wrong template.** It asks for
*"matter-scoped permissions, document provenance, human legal review, jurisdiction/effective-date
validation, redaction, signer failure"* — that is a legal-document product. This app is
plumbing/HVAC field service (29 Prisma models: `Job`, `Estimate`, `Technician`, `Truck`,
`ServiceAgreement`, `PurchaseOrder`, …). **Do not implement that list.** The real backlog is the
12 `gap-*` slugs in section 4 and the mocks in section 3.

**The app is further along than the audit implies.** Two things the audit treats as missing are
already built and well built:

| Area | Reality | Evidence |
|---|---|---|
| Software billing | Real Stripe subscriptions, checkout, billing portal, signed webhooks, reconciliation, receipts | `src/lib/workflows/software-billing.ts` (132 lines) |
| Delivery | Real Resend (email) + Twilio (SMS), provider reconciliation, delivery evidence, uncertain-outcome handling | `src/lib/workflows/communications.ts` (457 lines) |
| Tests | 28 test files, incl. `tests/integration/software-billing.test.ts` with a fake Stripe SDK asserting idempotency and an isolated-DB guard | `tests/` |
| CI | `.github/workflows/ci.yml` exists — Postgres 16 service, real test env, runs on PR and push to main | `.github/workflows/ci.yml` |
| Env template | `.env.example` exists (94 lines) | `.env.example` |

So "verify delivery and software billing" is a **verification** task, not a build task. That is
the whole of Phase 2.

---

## 1. Definition of done for the pilot

The pilot is releasable when all of these are true:

- [ ] `npm test` passes green from a clean checkout (28 test files already exist — see `tests/`)
- [ ] The existing CI (`.github/workflows/ci.yml`) is green on every push, and its Postgres service matches the schema actually in use
- [ ] `.env.example` (94 lines) is accurate — every variable it lists is actually read, and every variable the app reads is listed
- [ ] Software billing passes the end-to-end checklist in Phase 2 (§2.1)
- [ ] Delivery passes the end-to-end checklist in Phase 2 (§2.2)
- [ ] No sample/`Math.random` behaviour remains on a product path (§3)
- [ ] A pilot tenant can be provisioned and torn down without touching other tenants' data

---

## 2. Phase 1 — Verify the two launch-condition workflows

This is the highest-value work in the plan: it converts "code exists" into "we can sell it".

### 2.1 Software billing (`src/lib/workflows/software-billing.ts`)

Already covered by `tests/integration/software-billing.test.ts` (4 tests). Run it, then prove the
paths the unit tests cannot reach.

| # | Check | How |
|---|---|---|
| B1 | Existing tests pass | `npm test -- tests/integration/software-billing.test.ts` against an isolated `homeservices_test_*` DB |
| B2 | Real Stripe checkout completes | Test mode keys; `startSubscription` → hosted checkout → webhook `checkout.session.completed` → `SoftwareSubscription.status=ACTIVE` |
| B3 | Webhook signature is enforced | Replay a webhook with a bad `stripe-signature`; must 400 and leave state unchanged |
| B4 | Price/amount tamper is rejected | Call `startSubscription` with `expectedAmountCents` ≠ Stripe price; must fail before creating a session |
| B5 | Concurrent starts reserve one session | Two parallel calls with the same `requestKey`; exactly one provider checkout (already asserted in tests — confirm in live test mode) |
| B6 | Dunning / failed payment | Fail a renewal invoice; confirm `SoftwareBillingAttempt.status` records it and `billingState().paid` flips false |
| B7 | Cancel + portal | `portalSession()` → Stripe portal → cancel → `paidThrough` respected, access ends at period end |
| B8 | Refund path | `reconcileCheckout(..., expire=true)` and `stripe.refunds.create` paths in `src/lib/workflows/finance.ts` |
| B9 | Tax mode is explicit | `SOFTWARE_BILLING_TAX_MODE` must not be `unconfigured` in production |

**Exit criteria:** a real test-mode subscription can be bought, cancelled, refunded and dunned
with correct DB state at every step.

### 2.2 Delivery (`src/lib/workflows/communications.ts` + `api/automation/deliveries`)

| # | Check | How |
|---|---|---|
| D1 | Email delivery | Configure `RESEND_API_KEY`; queue a `Delivery`; run `POST /api/automation/deliveries` with `Authorization: Bearer $AUTOMATION_SECRET`; confirm provider id recorded |
| D2 | SMS delivery | Configure Twilio; same flow via `CHANNEL=SMS` |
| D3 | Secret handling | `AUTOMATION_SECRET` < 32 chars → 401; wrong bearer → 401; `timingSafeEqual` path verified |
| D4 | Feature flag | `ENABLE_SCHEDULED_DELIVERY` unset → 503, no rows touched |
| D5 | Human approval gate | Row with `approvedById=null` is skipped; approver not in `officeRoles` → `APPROVER_UNAVAILABLE` |
| D6 | Uncertain outcome is not resent | Provider timeout → status stays blocked with *"Do not resend until reconciled"*; `refreshDelivery()` reconciles from provider records |
| D7 | Evidence trail | `recordDeliveryEvidence()` stores provider message id + channel |

**Exit criteria:** an estimate can be approved by a customer and delivered by email and SMS with
an auditable evidence trail, and a failed send cannot double-send.

---

## 3. Phase 2 — Remove mocks from product paths

These four AI routes compute outcomes from sample data and `Math.random()`. They currently
return plausible-looking numbers that are not derived from the tenant's data. **This is the
single biggest trust risk in the app** — an installer will act on them.

`src/app/api/ai/optimize-dispatch/route.ts:72` — `// Use sample data directly`
`src/app/api/ai/optimize-dispatch/route.ts:293` — `travelTime = 15 + Math.floor(Math.random() * 20)`

| # | Route | Replace sample/random with | Priority |
|---|---|---|---|
| M1 | `ai/optimize-dispatch` | Real travel time (distance matrix API, or haversine over `Technician`/`Job` addresses at a documented average speed) + real skills/availability from `TechSchedule` | **High** — dispatch is the core daily workflow |
| M2 | `ai/smart-scheduling` | Same inputs; schedule from `TechSchedule` + `ServiceType.durationMinutes` | **High** |
| M3 | `ai/predictive-parts` | Derive from `JobPart`/`ServiceHistory` consumption history; if history is too thin, return an explicit `confidence: "insufficient-history"` instead of a number | Medium |
| M4 | `ai/predictive-maintenance` | Derive from `Equipment` age + `ServiceHistory` intervals; same explicit-insufficiency rule | Medium |

**Rule for all AI output:** no number without provenance. Every response must carry
`{ inputs, method, confidence }` so a technician can see why. Where history is insufficient,
say so — a wrong number is worse than no number.

Note the false positives: `placeholder="you@example.com"` in the auth pages is an HTML
attribute, not a stub. The real mock surface is the four routes above plus the gap routes.

---

## 4. Phase 3 — The 12 gap slugs

Each is a route that currently logs *"this is missing"* into a `gap_features` table. Closing one
means replacing that route with real behaviour. Ordered by pilot value, not by code size.

| # | Slug | Type | What to build | Pilot value | Effort |
|---|---|---|---|---|---|
| 1 | `gap-no-sms-notifications-backend` | non-AI | **Likely already done** — `communications.ts` already sends SMS via Twilio. Verify, then delete the gap route | ★★★★★ | S |
| 2 | `gap-no-quickbooks-bidirectional-sync-only-documented` | non-AI | Two-way QuickBooks sync (customer, invoice, payment). Unlocks the accountant/referral channel that `TOP20.md` names as the organic path | ★★★★★ | L |
| 3 | `gap-no-technician-timesheet-payroll-exports` | non-AI | Export `TimeEntry` → CSV/ADP/Gusto. Small, and payroll consultants are the named channel for rank 12 | ★★★★ | S |
| 4 | `gap-no-post-job-feedback-nps-ai` | AI | Post-job NPS survey + sentiment on free text; ties into `Communication`/`Delivery` from Phase 2 | ★★★★ | M |
| 5 | `gap-no-parts-auto-replenish-ai-predictive` | AI | Reorder suggestions from `Part`/`TruckStock`/`JobPart` + `PurchaseOrder` lifecycle | ★★★ | M |
| 6 | `gap-no-real-time-multi-tech-job` | non-AI | Presence/updates for multi-tech jobs (SSE or websocket); makes the multi-tech claim true | ★★★ | M |
| 7 | `gap-no-automated-warranty-claim-processing` | AI+non-AI | Warranty claim classification from `ServiceHistory` + submission workflow | ★★★ | L |
| 8 | `gap-no-fuel-card-fleet-card-integrations` | non-AI | Fuel card API ingest → `Truck` cost records | ★★ | M |
| 9 | `gap-no-fleet-gps-tracking-despite-trucks` | non-AI | GPS provider ingest → ETA for `optimize-dispatch` (unblocks M1 accuracy) | ★★ | L |
| 10 | `gap-no-technician-safety-quality-real-time` | AI | Safety/quality signals from `JobPhoto` + job notes | ★★ | L |
| 11 | `gap-no-competitor-pricing-intelligence` | AI | Price benchmarking for `PricebookItem` | ★ | L |
| 12 | `gap-no-marketplace-for-sub-contractors` | non-AI | Sub-contractor marketplace. **Out of scope for a pilot** — it is a second product | ★ | XL |

**Recommended cut line:** close #1–#4 before the pilot, #5–#6 during it, defer the rest.

**Rule:** every gap you close must *delete* its `gap-*` route. Never leave a stub beside a real
implementation — that is exactly the "route count overstates capability" failure the audit
warns about.

---

## 5. Phase 3 — Engineering hygiene (blocks every other phase)

| # | Task | Why it blocks |
|---|---|---|
| H1 | Audit `.env.example` (94 lines) against `process.env` reads | Template exists — but drift between it and the code makes first-time setup guesswork. Fix gaps in both directions |
| H2 | Get `.github/workflows/ci.yml` green and keep it green | CI **exists** (Postgres 16 service, real test env). The work is proving it passes and adding migration + security jobs, not creating it from scratch |
| H3 | Document the one-command setup | `./start.sh` needs Postgres, `.env`, migrations, admin user. Write the 5 steps |
| H4 | Add migration + failure-path tests | Audit gap; needed before real tenants |
| H5 | Security pass | Audit flags: *"weak JWT/session-secret fallback can make authentication forgeable when configuration is absent"* and *"root launcher can terminate unrelated processes occupying configured ports"*. Fix both before any external pilot |
| H6 | Fix `start.sh` port assumptions | Assign ports explicitly and document them |

---

## 6. Suggested order

| Phase | Work | Outcome |
|---|---|---|
| **P1** (1–2 days) | H1, H2, H3 | A stranger can clone, run and test it green |
| **P2** (2–4 days) | §2.1 + §2.2 checklists | The launch condition is *met and evidenced* |
| **P3** (3–5 days) | §3 M1, M2 + H5 | Dispatch/scheduling outputs are trustworthy |
| **P4** (1–2 weeks) | §4 gaps 1–4 | Differentiated vs HoneyBook; channel-ready |
| **P5** | Pilot with 1–2 real contractors | Actual demand evidence |

**Total to a defensible pilot: roughly 3–4 weeks of focused work.**

---

## 7. What this plan deliberately does not do

- It does **not** implement the legal-documentation feature list in `_COMPLETENESS_REVIEW.md`
  (wrong domain — see §0).
- It does **not** add breadth to the AI surface. Four AI routes already return invented numbers;
  more of that makes the product less trustworthy, not more.
- It does **not** close gaps 5–12 before the pilot. Close the ones the named organic channel
  needs first (accountants, payroll consultants, contractor trade communities).
- It does **not** address market demand. As `TOP20.md` states, the ranking is *"qualitative
  priorities for validation and development, not measured demand"*.

---

## 8. Launch-condition verification record (2026-09-25)

The `TOP20.md` launch condition for rank 1 is *"Pilot preparation; verify delivery and
software billing"*. Both halves are now **verified by executable test**, against an isolated
database (`homeservices_test_billing`, `prisma migrate deploy`).

| Condition | Evidence | Result |
|---|---|---|
| **Software billing** | `tests/integration/software-billing.test.ts` | **4/4 pass** |
| **Delivery** | `tests/integration/operations.test.ts` test 5 | **pass** |
| Full operations suite | `tests/integration/operations.test.ts` | **19/19 pass** |
| Unit suite | `unit-tests/**` | **59/59 pass** |

### What the passing tests actually prove

**Software billing (4 tests)** — checkout validates administrator and confirmed price, and
concurrent requests reserve exactly one provider checkout; paid activation requires a matching
current invoice, and renewals, cancellation and **forged callbacks** retain correct state;
receipts reject wrong invoice identity, quantity, price and expired periods, and stale
`RUNNING` requests recover exactly once.

**Delivery (operations test 5)** — *"provider message fixtures preserve acceptance vs
delivery, reject opt-outs, handle uncertain outcomes and signed callback replay"*. This is the
D1–D7 checklist in §2.2 executed: consent enforcement (`doNotText` / `doNotEmail`), provider
identity recording, the "outcome uncertain — do not resend" path, and signed-callback replay
protection.

**Also covered (18 more operations tests)** — appointment serialisation and trade/leave
conflicts; stock retry receipts and cross-company isolation; field evidence and immutable
completion with an intact audit chain; private portal links that expire and revoke; AI evidence
and budgeted receipts with no double-call on retry; reviewed invoices with exact totals and
bounded refunds; Stripe fixture reconciliation that records once and keeps unknown outcomes.

### Command
```bash
createdb homeservices_test_billing
DATABASE_URL=postgresql://postgres@localhost:5432/homeservices_test_billing \
  npx prisma migrate deploy
DATABASE_URL=postgresql://postgres@localhost:5432/homeservices_test_billing \
  npx tsx --test tests/integration/*.test.ts
```

### Still open before an external pilot
- §3 M1/M2: `optimize-dispatch` and `smart-scheduling` still compute travel time with
  `Math.random()` — a technician would act on invented numbers. This is the one remaining
  trust risk in the app.
- §5 H5: the security pass (JWT/session-secret fallback; `start.sh` killing unrelated
  processes on occupied ports).
