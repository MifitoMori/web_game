import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ShopService {
  constructor(private readonly prisma: PrismaService) {}

  async getCatalogForUser(userId: number) {
    const catalogItems = await this.prisma.catalogItem.findMany({
      where: {
        type: {
          in: ['skin', 'trail', 'title'],
        },
      },
      orderBy: { id: 'asc' },
      include: {
        inventoryItems: {
          where: { userId },
          select: {
            id: true,
            isEquipped: true,
          },
        },
      },
    });

    return catalogItems.map(({ inventoryItems, ...item }) => {
      const ownedItem = inventoryItems[0];

      return {
        ...item,
        owned: !!ownedItem,
        equipped: ownedItem?.isEquipped ?? false,
      };
    });
  }

  async purchaseItem(userId: number, slug: string) {
    return this.prisma.$transaction(async (tx) => {
      const catalogItem = await tx.catalogItem.findFirst({
        where: {
          slug,
          type: {
            in: ['skin', 'trail', 'title'],
          },
        },
      });

      if (!catalogItem) {
        throw new NotFoundException('Предмет не найден');
      }

      const existingItem = await tx.inventoryItem.findUnique({
        where: {
          userId_catalogItemId: {
            userId,
            catalogItemId: catalogItem.id,
          },
        },
      });

      if (existingItem) {
        throw new BadRequestException('Этот предмет уже приобретён');
      }

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          profileId: true,
          profile: {
            select: {
              credits: true,
            },
          },
        },
      });

      if (!user?.profile) {
        throw new NotFoundException('Профиль пользователя не найден');
      }

      if (user.profile.credits < catalogItem.price) {
        throw new BadRequestException('Недостаточно кредитов');
      }

      const updatedProfile = await tx.profile.update({
        where: { id: user.profileId },
        data: { credits: { decrement: catalogItem.price } },
        select: {
          credits: true,
        },
      });

      const inventoryItem = await tx.inventoryItem.create({
        data: {
          userId,
          catalogItemId: catalogItem.id,
        },
        select: {
          id: true,
          isEquipped: true,
          receivedAt: true,
        },
      });

      return {
        success: true,
        item: {
          ...catalogItem,
          owned: true,
          equipped: inventoryItem.isEquipped,
        },
        inventoryItem,
        balances: updatedProfile,
      };
    });
  }
}
