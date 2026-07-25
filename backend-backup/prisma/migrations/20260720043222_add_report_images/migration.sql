-- CreateTable
CREATE TABLE "report_images" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_images_reportId_idx" ON "report_images"("reportId");

-- AddForeignKey
ALTER TABLE "report_images" ADD CONSTRAINT "report_images_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "item_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
