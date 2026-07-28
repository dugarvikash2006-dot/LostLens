-- CreateTable
CREATE TABLE "report_image_embeddings" (
    "id" TEXT NOT NULL,
    "reportId" TEXT,
    "publicId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "embeddingDimension" INTEGER NOT NULL,
    "modelName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_image_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "report_image_embeddings_publicId_key" ON "report_image_embeddings"("publicId");

-- CreateIndex
CREATE INDEX "report_image_embeddings_reportId_idx" ON "report_image_embeddings"("reportId");

-- AddForeignKey
ALTER TABLE "report_image_embeddings" ADD CONSTRAINT "report_image_embeddings_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "item_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

