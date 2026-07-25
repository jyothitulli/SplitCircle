-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "merchant" TEXT,
ADD COLUMN     "ocrExtracted" JSONB,
ADD COLUMN     "receiptUrl" TEXT;
