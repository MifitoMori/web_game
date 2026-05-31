ALTER TABLE "Profile"
ADD COLUMN "gems" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "InventoryItem_userId_catalogItemId_key"
ON "InventoryItem"("userId", "catalogItemId");
