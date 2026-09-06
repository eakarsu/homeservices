ALTER TYPE "InvoiceStatus" ADD VALUE 'ISSUED';
ALTER TABLE "Invoice" ADD COLUMN version INTEGER NOT NULL DEFAULT 1, ADD COLUMN "reviewedAt" TIMESTAMP(3), ADD COLUMN "reviewedById" TEXT REFERENCES "User"(id), ADD COLUMN "creditCents" INTEGER NOT NULL DEFAULT 0 CHECK ("creditCents">=0), ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "Payment" ADD COLUMN "verifiedAt" TIMESTAMP(3), ADD COLUMN "actorId" TEXT REFERENCES "User"(id), ADD COLUMN source TEXT;
ALTER TABLE "PaymentCheckout" ADD COLUMN "invoiceVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "PaymentRefund" ADD COLUMN "creditInvoice" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN kind TEXT NOT NULL DEFAULT 'STRIPE';
CREATE TABLE "InvoiceCredit" (id TEXT PRIMARY KEY, "companyId" TEXT NOT NULL REFERENCES "Company"(id), "invoiceId" TEXT NOT NULL REFERENCES "Invoice"(id), "amountCents" INTEGER NOT NULL CHECK ("amountCents">0), reason TEXT NOT NULL, "actorId" TEXT NOT NULL REFERENCES "User"(id), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX "InvoiceCredit_invoiceId_createdAt_idx" ON "InvoiceCredit"("invoiceId","createdAt");
CREATE TRIGGER "InvoiceCredit_append_only" BEFORE UPDATE OR DELETE ON "InvoiceCredit" FOR EACH ROW EXECUTE FUNCTION reject_immutable_record_mutation();
