CREATE UNIQUE INDEX "Payment_verified_stripe_receipt" ON "Payment"("stripePaymentId") WHERE source='STRIPE' AND "verifiedAt" IS NOT NULL;
CREATE FUNCTION retain_verified_payment_receipt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF OLD."verifiedAt" IS NOT NULL THEN RAISE EXCEPTION 'Verified payment receipts are append-only'; END IF; IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW; END $$;
CREATE TRIGGER "Payment_verified_append_only" BEFORE UPDATE OR DELETE ON "Payment" FOR EACH ROW EXECUTE FUNCTION retain_verified_payment_receipt();
