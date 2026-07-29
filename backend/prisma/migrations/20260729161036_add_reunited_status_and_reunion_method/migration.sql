-- CreateEnum
CREATE TYPE "ReunionMethod" AS ENUM ('AI_MATCH', 'CONTACTED_ME', 'MANUAL_SEARCH', 'CAMPUS_SECURITY', 'FRIEND');

-- AlterEnum
ALTER TYPE "ReportStatus" ADD VALUE 'REUNITED';

-- AlterTable
ALTER TABLE "item_reports" ADD COLUMN     "reunionMethod" "ReunionMethod",
ADD COLUMN     "reunitedAt" TIMESTAMP(3);
