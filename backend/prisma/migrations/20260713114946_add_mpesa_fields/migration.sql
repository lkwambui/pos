-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "mpesaCheckoutRequestId" TEXT,
ADD COLUMN     "mpesaMerchantRequestId" TEXT,
ADD COLUMN     "mpesaPhone" TEXT;
