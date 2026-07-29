-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "recurrence" TEXT,
ADD COLUMN     "status" TEXT DEFAULT 'PAID';
