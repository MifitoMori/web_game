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

  console.log(`Catalog seeded: ${catalogItems.length} items`);
}

main()
  .catch((error) => {
    console.error('Catalog seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
