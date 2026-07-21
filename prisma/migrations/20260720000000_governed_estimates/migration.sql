-- Extend the estimate lifecycle without rewriting existing enum values.
ALTER TYPE "EstimateStatus" ADD VALUE 'READY';
ALTER TYPE "EstimateStatus" ADD VALUE 'DELIVERY_PENDING';

-- Bring post-initial schema additions under migration control.
ALTER TABLE "Customer" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Job" ADD COLUMN "portalToken" TEXT;
ALTER TABLE "Property" ADD COLUMN "lat" DECIMAL(10,7), ADD COLUMN "lng" DECIMAL(10,7);
ALTER TABLE "ServiceAgreement"
  ADD COLUMN "lastPaymentAmount" DECIMAL(10,2),
  ADD COLUMN "lastPaymentDate" TIMESTAMP(3),
  ADD COLUMN "nextBillingDate" TIMESTAMP(3),
  ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'trial',
  ADD COLUMN "stripePriceId" TEXT,
  ADD COLUMN "stripeSubscriptionId" TEXT,
  ADD COLUMN "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "User"
  ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "pushPlatform" TEXT,
  ADD COLUMN "pushToken" TEXT,
  ADD COLUMN "pushTokenUpdatedAt" TIMESTAMP(3),
  ADD COLUMN "resetToken" TEXT,
  ADD COLUMN "resetTokenExpiry" TIMESTAMP(3),
  ADD COLUMN "verificationToken" TEXT,
  ADD COLUMN "verificationTokenExpiry" TIMESTAMP(3);

-- Existing estimates receive a deterministic seven-year operational retention date.
ALTER TABLE "Estimate"
  ADD COLUMN "approvalEvidence" JSONB,
  ADD COLUMN "approvalTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN "approvalTokenHash" TEXT,
  ADD COLUMN "jurisdiction" TEXT,
  ADD COLUMN "legalHold" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "legalHoldReason" TEXT,
  ADD COLUMN "retentionUntil" TIMESTAMP(3),
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewedById" TEXT,
  ADD COLUMN "signatureHash" TEXT,
  ADD COLUMN "templateEffectiveDate" TIMESTAMP(3),
  ADD COLUMN "templateSource" TEXT,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
UPDATE "Estimate" SET "retentionUntil" = "createdAt" + INTERVAL '7 years' WHERE "retentionUntil" IS NULL;
ALTER TABLE "Estimate" ALTER COLUMN "retentionUntil" SET NOT NULL;

CREATE TABLE "AIResult" (
  "id" TEXT NOT NULL,
  "feature" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "userId" TEXT,
  "companyId" TEXT,
  "jobId" TEXT,
  "customerId" TEXT,
  "input" JSONB NOT NULL,
  "output" JSONB NOT NULL,
  "durationMs" INTEGER,
  "success" BOOLEAN NOT NULL DEFAULT true,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EstimateVersion" (
  "id" TEXT NOT NULL,
  "estimateId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "provenance" JSONB NOT NULL,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EstimateVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditEvent" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "jobId" TEXT,
  "estimateId" TEXT,
  "payload" JSONB NOT NULL,
  "previousHash" TEXT,
  "eventHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIResult_feature_idx" ON "AIResult"("feature");
CREATE INDEX "AIResult_userId_idx" ON "AIResult"("userId");
CREATE INDEX "AIResult_companyId_idx" ON "AIResult"("companyId");
CREATE INDEX "AIResult_jobId_idx" ON "AIResult"("jobId");
CREATE INDEX "AIResult_createdAt_idx" ON "AIResult"("createdAt");
CREATE INDEX "EstimateVersion_estimateId_createdAt_idx" ON "EstimateVersion"("estimateId", "createdAt");
CREATE UNIQUE INDEX "EstimateVersion_estimateId_version_key" ON "EstimateVersion"("estimateId", "version");
CREATE UNIQUE INDEX "AuditEvent_eventHash_key" ON "AuditEvent"("eventHash");
CREATE INDEX "AuditEvent_companyId_createdAt_idx" ON "AuditEvent"("companyId", "createdAt");
CREATE INDEX "AuditEvent_entityType_entityId_createdAt_idx" ON "AuditEvent"("entityType", "entityId", "createdAt");
CREATE INDEX "AuditEvent_jobId_createdAt_idx" ON "AuditEvent"("jobId", "createdAt");
CREATE INDEX "AuditEvent_estimateId_createdAt_idx" ON "AuditEvent"("estimateId", "createdAt");
CREATE UNIQUE INDEX "Estimate_approvalTokenHash_key" ON "Estimate"("approvalTokenHash");
CREATE UNIQUE INDEX "Job_portalToken_key" ON "Job"("portalToken");

ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EstimateVersion" ADD CONSTRAINT "EstimateVersion_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EstimateVersion" ADD CONSTRAINT "EstimateVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Defense in depth: provenance/audit rows are append-only even if application
-- code is bypassed, and active retention/hold controls cannot be shortened.
CREATE FUNCTION reject_immutable_record_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% records are append-only', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "AuditEvent_append_only"
BEFORE UPDATE OR DELETE ON "AuditEvent"
FOR EACH ROW EXECUTE FUNCTION reject_immutable_record_mutation();

CREATE TRIGGER "EstimateVersion_append_only"
BEFORE UPDATE OR DELETE ON "EstimateVersion"
FOR EACH ROW EXECUTE FUNCTION reject_immutable_record_mutation();

CREATE FUNCTION enforce_estimate_retention() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' AND (OLD."legalHold" OR OLD."retentionUntil" > CURRENT_TIMESTAMP) THEN
    RAISE EXCEPTION 'estimate is subject to retention or hold';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW."retentionUntil" < OLD."retentionUntil" THEN
    RAISE EXCEPTION 'estimate retention cannot be shortened';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD."legalHold" AND NOT NEW."legalHold" THEN
    RAISE EXCEPTION 'estimate hold release requires the privileged hold procedure';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Estimate_retention_guard"
BEFORE UPDATE OR DELETE ON "Estimate"
FOR EACH ROW EXECUTE FUNCTION enforce_estimate_retention();
