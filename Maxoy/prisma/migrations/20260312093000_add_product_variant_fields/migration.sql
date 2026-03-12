ALTER TABLE "Product"
ADD COLUMN "variantGroup" TEXT,
ADD COLUMN "variantLabelTR" TEXT,
ADD COLUMN "variantLabelEN" TEXT,
ADD COLUMN "colorToneTR" TEXT,
ADD COLUMN "colorToneEN" TEXT,
ADD COLUMN "secondaryColorTR" TEXT,
ADD COLUMN "secondaryColorEN" TEXT,
ADD COLUMN "swatchPrimary" TEXT,
ADD COLUMN "swatchSecondary" TEXT,
ADD COLUMN "variantSortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Product_variantGroup_idx" ON "Product"("variantGroup");
