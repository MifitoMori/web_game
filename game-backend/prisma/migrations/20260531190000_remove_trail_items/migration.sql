DELETE FROM "InventoryItem"
WHERE "catalogItemId" IN (
  SELECT "id" FROM "CatalogItem" WHERE "type" = 'trail'
);

DELETE FROM "CatalogItem" WHERE "type" = 'trail';
