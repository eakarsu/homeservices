ALTER TABLE "PaymentRefund" ADD COLUMN "settledAt" TIMESTAMP(3);
CREATE INDEX "PaymentRefund_companyId_settledAt_idx" ON "PaymentRefund"("companyId","settledAt");
