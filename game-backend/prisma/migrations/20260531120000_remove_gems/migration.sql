-- Items priced in the removed "gems" currency fall back to credits
UPDATE "CatalogItem" SET "currency" = 'credits' WHERE "currency" = 'gems';

-- Remove the gems balance from profiles
ALTER TABLE "Profile" DROP COLUMN IF EXISTS "gems";
