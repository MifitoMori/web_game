import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { catalogItems } from './seeds/catalog-items';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  for (const item of catalogItems) {
    await prisma.catalogItem.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        rarity: item.rarity,
        type: item.type,
        price: item.price,
        currency: item.currency,
      },
      create: item,
    });
  }

  const defaultSkin = await prisma.catalogItem.findUnique({
    where: { slug: 'hitman-skin' },
    select: { id: true },
  });
  const defaultTitle = await prisma.catalogItem.findUnique({
    where: { slug: 'newcomer-title' },
    select: { id: true },
  });

  if (defaultSkin && defaultTitle) {
    const users = await prisma.user.findMany({
      select: { id: true },
    });

    for (const user of users) {
      await ensureDefaultLoadoutItem(user.id, defaultSkin.id, 'skin');
      await ensureDefaultLoadoutItem(user.id, defaultTitle.id, 'title');
    }
  }

  console.log(`Catalog seeded: ${catalogItems.length} items`);
}

async function ensureDefaultLoadoutItem(
  userId: number,
  catalogItemId: number,
  type: 'skin' | 'title',
) {
  const equippedItem = await prisma.inventoryItem.findFirst({
    where: {
      userId,
      isEquipped: true,
      catalogItem: { type },
    },
    select: { id: true },
  });

  await prisma.inventoryItem.upsert({
    where: {
      userId_catalogItemId: {
        userId,
        catalogItemId,
      },
    },
    update: equippedItem ? {} : { isEquipped: true },
    create: {
      userId,
      catalogItemId,
      isEquipped: !equippedItem,
    },
  });
}

main()
  .catch((error) => {
    console.error('Catalog seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
