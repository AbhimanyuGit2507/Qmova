-- AlterTable TenantPaymentAccount
ALTER TABLE "TenantPaymentAccount" ADD COLUMN IF NOT EXISTS "paystackSubaccountCode" TEXT;
ALTER TABLE "TenantPaymentAccount" ADD COLUMN IF NOT EXISTS "paystackBankCode" TEXT;
ALTER TABLE "TenantPaymentAccount" ADD COLUMN IF NOT EXISTS "paystackBankName" TEXT;
ALTER TABLE "TenantPaymentAccount" ADD COLUMN IF NOT EXISTS "paystackAccountNumber" TEXT;
ALTER TABLE "TenantPaymentAccount" ADD COLUMN IF NOT EXISTS "paystackAccountName" TEXT;

-- AlterTable BookingPayment
ALTER TABLE "BookingPayment" ADD COLUMN IF NOT EXISTS "paystackReference" TEXT;
ALTER TABLE "BookingPayment" ADD COLUMN IF NOT EXISTS "paystackAccessCode" TEXT;
ALTER TABLE "BookingPayment" ADD COLUMN IF NOT EXISTS "paystackAuthorizationUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BookingPayment_paystackReference_key" ON "BookingPayment"("paystackReference");
CREATE INDEX IF NOT EXISTS "TenantPaymentAccount_paystackSubaccountCode_idx" ON "TenantPaymentAccount"("paystackSubaccountCode");
CREATE INDEX IF NOT EXISTS "BookingPayment_paystackReference_idx" ON "BookingPayment"("paystackReference");
