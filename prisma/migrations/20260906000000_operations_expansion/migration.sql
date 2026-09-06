-- AlterTable
ALTER TABLE "Technician" ADD COLUMN     "locationConsentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TimeEntry" ADD COLUMN     "approvalStatus" TEXT NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "vendorId" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "AIResult" ADD COLUMN     "completionTokens" INTEGER,
ADD COLUMN     "costUsd" DECIMAL(12,6),
ADD COLUMN     "promptTokens" INTEGER,
ADD COLUMN     "providerReceipt" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "reviewedText" TEXT;

-- CreateTable
CREATE TABLE "WorkflowRecord" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "customerId" TEXT,
    "jobId" TEXT,
    "data" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingRequest" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "propertyId" TEXT,
    "serviceTypeId" TEXT NOT NULL,
    "technicianId" TEXT,
    "jobId" TEXT,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobChecklist" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedById" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "jobId" TEXT,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "providerId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "requestKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalGrant" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortalGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerReview" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "encryptedSecret" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationRun" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "companyId" TEXT,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "lastError" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentCheckout" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "sessionId" TEXT,
    "paymentIntentId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentCheckout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRefund" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "providerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestKey" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentRefund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkflowRecord_companyId_module_status_idx" ON "WorkflowRecord"("companyId", "module", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BookingRequest_jobId_key" ON "BookingRequest"("jobId");

-- CreateIndex
CREATE INDEX "BookingRequest_companyId_status_startAt_idx" ON "BookingRequest"("companyId", "status", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobChecklist_jobId_key" ON "JobChecklist"("jobId");

-- CreateIndex
CREATE INDEX "StockMovement_companyId_partId_createdAt_idx" ON "StockMovement"("companyId", "partId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StockMovement_companyId_requestKey_key" ON "StockMovement"("companyId", "requestKey");

-- CreateIndex
CREATE INDEX "Delivery_companyId_status_scheduledAt_idx" ON "Delivery"("companyId", "status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_companyId_requestKey_key" ON "Delivery"("companyId", "requestKey");

-- CreateIndex
CREATE UNIQUE INDEX "PortalGrant_tokenHash_key" ON "PortalGrant"("tokenHash");

-- CreateIndex
CREATE INDEX "PortalGrant_companyId_customerId_idx" ON "PortalGrant"("companyId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerReview_jobId_key" ON "CustomerReview"("jobId");

-- CreateIndex
CREATE INDEX "CustomerReview_companyId_createdAt_idx" ON "CustomerReview"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConnection_companyId_provider_key" ON "IntegrationConnection"("companyId", "provider");

-- CreateIndex
CREATE INDEX "IntegrationRun_companyId_provider_createdAt_idx" ON "IntegrationRun"("companyId", "provider", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationRun_companyId_requestKey_key" ON "IntegrationRun"("companyId", "requestKey");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderEvent_provider_externalId_key" ON "ProviderEvent"("provider", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentCheckout_sessionId_key" ON "PaymentCheckout"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentCheckout_paymentIntentId_key" ON "PaymentCheckout"("paymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentCheckout_companyId_requestKey_key" ON "PaymentCheckout"("companyId", "requestKey");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRefund_providerId_key" ON "PaymentRefund"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRefund_companyId_requestKey_key" ON "PaymentRefund"("companyId", "requestKey");


-- Retain ambiguous legacy purchase orders without assigning them to a guessed company.
UPDATE "PurchaseOrder" po SET "companyId" = owners.company
FROM (SELECT i."purchaseOrderId", MIN(p."companyId") AS company FROM "PurchaseOrderItem" i JOIN "Part" p ON p.id=i."partId" GROUP BY i."purchaseOrderId" HAVING COUNT(DISTINCT p."companyId")=1) owners
WHERE po.id=owners."purchaseOrderId";
ALTER TABLE "JobPhoto" ADD COLUMN bytes BYTEA, ADD COLUMN "mediaType" TEXT, ADD COLUMN "contentHash" TEXT, ADD COLUMN "actorId" TEXT;
CREATE TABLE "WorkflowMutation" (id TEXT PRIMARY KEY, "companyId" TEXT NOT NULL, "actorId" TEXT NOT NULL, action TEXT NOT NULL, "inputHash" TEXT NOT NULL, response JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX "WorkflowMutation_companyId_createdAt_idx" ON "WorkflowMutation"("companyId", "createdAt");
CREATE TABLE "TechnicianTimeOff" (id TEXT PRIMARY KEY, "companyId" TEXT NOT NULL, "technicianId" TEXT NOT NULL REFERENCES "Technician"(id), "startAt" TIMESTAMP(3) NOT NULL, "endAt" TIMESTAMP(3) NOT NULL, reason TEXT NOT NULL, "createdById" TEXT NOT NULL REFERENCES "User"(id), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CHECK ("endAt">"startAt"));
CREATE INDEX "TechnicianTimeOff_technicianId_startAt_idx" ON "TechnicianTimeOff"("technicianId", "startAt");
ALTER TABLE "BookingRequest" ADD CONSTRAINT booking_window CHECK ("endAt">"startAt"), ADD CONSTRAINT booking_status CHECK (status IN ('REQUESTED','CONFIRMED','CANCELLED','COMPLETED'));
ALTER TABLE "CustomerReview" ADD CONSTRAINT review_rating CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE "TimeEntry" ADD CONSTRAINT time_approval CHECK ("approvalStatus" IN ('DRAFT','SUBMITTED','APPROVED','REJECTED'));
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT receipt_quantity CHECK (quantity > 0 AND "receivedQty" BETWEEN 0 AND quantity);
ALTER TABLE "Part" ADD CONSTRAINT warehouse_nonnegative CHECK ("quantityOnHand">=0) NOT VALID;
ALTER TABLE "TruckStock" ADD CONSTRAINT truck_stock_nonnegative CHECK (quantity>=0) NOT VALID;
ALTER TABLE "WorkflowRecord" ADD CONSTRAINT "WorkflowRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JobChecklist" ADD CONSTRAINT "JobChecklist_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PortalGrant" ADD CONSTRAINT "PortalGrant_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerReview" ADD CONSTRAINT "CustomerReview_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IntegrationRun" ADD CONSTRAINT "IntegrationRun_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProviderEvent" ADD CONSTRAINT "ProviderEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentCheckout" ADD CONSTRAINT "PaymentCheckout_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentRefund" ADD CONSTRAINT "PaymentRefund_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkflowMutation" ADD CONSTRAINT "WorkflowMutation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TechnicianTimeOff" ADD CONSTRAINT "TechnicianTimeOff_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkflowRecord" ADD CONSTRAINT "WorkflowRecord_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkflowRecord" ADD CONSTRAINT "WorkflowRecord_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JobChecklist" ADD CONSTRAINT "JobChecklist_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PortalGrant" ADD CONSTRAINT "PortalGrant_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerReview" ADD CONSTRAINT "CustomerReview_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerReview" ADD CONSTRAINT "CustomerReview_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentCheckout" ADD CONSTRAINT "PaymentCheckout_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentRefund" ADD CONSTRAINT "PaymentRefund_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentRefund" ADD CONSTRAINT "PaymentRefund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"(id) ON DELETE RESTRICT ON UPDATE CASCADE;
