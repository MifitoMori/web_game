ALTER TABLE "CatalogItem"
ADD COLUMN "slug" TEXT,
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'credits';

UPDATE "CatalogItem"
SET "slug" = 'catalog-item-' || "id"
WHERE "slug" IS NULL;

ALTER TABLE "CatalogItem"
ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "CatalogItem_slug_key" ON "CatalogItem"("slug");
