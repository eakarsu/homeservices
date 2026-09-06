CREATE TABLE "SoftwareSubscription" (
 "companyId" TEXT PRIMARY KEY REFERENCES "Company"("id"), "customerId" TEXT UNIQUE, "subscriptionId" TEXT UNIQUE,
 "planKey" TEXT, "priceId" TEXT, "status" TEXT NOT NULL DEFAULT 'UNSUBSCRIBED', "paidThrough" TIMESTAMP(3),
 "periodStart" TIMESTAMP(3), "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false, "checkedAt" TIMESTAMP(3), "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "SoftwareBillingAttempt" (
 "id" TEXT PRIMARY KEY, "companyId" TEXT NOT NULL REFERENCES "Company"("id"), "actorId" TEXT NOT NULL REFERENCES "User"("id"),
 "requestKey" TEXT NOT NULL, "planKey" TEXT NOT NULL, "priceId" TEXT NOT NULL, "amountCents" INTEGER NOT NULL,
 "interval" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'PENDING', "sessionId" TEXT UNIQUE, "customerId" TEXT,
 "customerName" TEXT NOT NULL, "params" JSONB, "error" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "software_attempt_amount" CHECK ("amountCents">0),
 CONSTRAINT "software_attempt_status" CHECK ("status" IN ('PENDING','RUNNING','UNKNOWN','OPEN','COMPLETE','EXPIRED'))
);
CREATE UNIQUE INDEX "SoftwareBillingAttempt_companyId_requestKey_key" ON "SoftwareBillingAttempt"("companyId","requestKey");
CREATE INDEX "SoftwareBillingAttempt_companyId_status_idx" ON "SoftwareBillingAttempt"("companyId","status");
CREATE UNIQUE INDEX "software_one_open_attempt" ON "SoftwareBillingAttempt"("companyId") WHERE "status" IN ('PENDING','RUNNING','UNKNOWN','OPEN');
CREATE TABLE "SoftwareBillingEvent" ("id" TEXT PRIMARY KEY,"payloadHash" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
