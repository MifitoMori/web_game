DELETE FROM "InventoryItem"
WHERE "catalogItemId" IN (
  SELECT "id" FROM "CatalogItem" WHERE "type" = 'effect'
);

DELETE FROM "CatalogItem" WHERE "type" = 'effect';

ALTER TABLE "Profile" DROP COLUMN IF EXISTS "rating";
