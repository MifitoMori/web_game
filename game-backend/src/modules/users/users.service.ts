import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly safeUserSelect = {
    id: true,
    email: true,
    login: true,
    firstName: true,
    secondName: true,
    gender: true,
    birthDate: true,
    avatarUrl: true,
    role: true,
    createdAt: true,
    updatedAt: true,
    profile: {
      select: {
        id: true,
        totalGames: true,
        wins: true,
        losses: true,
        draws: true,
        maxStreak: true,
        rating: true,
        credits: true,
        gems: true,
        experience: true,
        level: true,
      },
    },
  } as const;

  findByLogin(login: string) {
    return this.prisma.user.findUnique({
      where: { login },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  create(data: {
    email: string;
    login: string;
    passwordHash: string;
    firstName: string;
    secondName: string;
    gender: string;
    birthDate: Date;
  }) {
    return this.prisma.user.create({
      data: {
        ...data,
        profile: {
          create: {},
        },
      },
      select: this.safeUserSelect,
    });
  }

  updateRefreshTokenHash(id: number, refreshTokenHash: string | null) {
    return this.prisma.user.update({
      where: { id },
      data: { refreshTokenHash },
    });
  }

  async getSafeById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: this.safeUserSelect,
    });
  }

  async getProfileView(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        login: true,
        email: true,
        firstName: true,
        secondName: true,
        avatarUrl: true,
        createdAt: true,
        profile: {
          select: {
            totalGames: true,
            wins: true,
            losses: true,
            draws: true,
            maxStreak: true,
            rating: true,
            credits: true,
            gems: true,
            experience: true,
            level: true,
          },
        },
        inventoryItems: {
          orderBy: {
            receivedAt: 'desc',
          },
          select: {
            id: true,
            isEquipped: true,
            catalogItem: {
              select: {
                slug: true,
                name: true,
                description: true,
                rarity: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!user?.profile) {
      return null;
    }

    const inventory = user.inventoryItems.map((item) => ({
      id: item.id.toString(),
      slug: item.catalogItem.slug,
      name: item.catalogItem.name,
      description: item.catalogItem.description,
      rarity: item.catalogItem.rarity,
      type: item.catalogItem.type,
      equipped: item.isEquipped,
      unlocked: true,
    }));

    return {
      user: {
        id: user.id,
        login: user.login,
        email: user.email,
        firstName: user.firstName,
        secondName: user.secondName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      profile: user.profile,
      inventory,
    };
  }

  async equipItem(userId: number, inventoryItemId: number) {
    return this.prisma.$transaction(async (tx) => {
      const inventoryItem = await tx.inventoryItem.findFirst({
        where: {
          id: inventoryItemId,
          userId,
        },
        select: {
          id: true,
          catalogItem: {
            select: {
              type: true,
            },
          },
        },
      });

      if (!inventoryItem) {
        throw new NotFoundException('Предмет не найден в инвентаре');
      }

      await tx.inventoryItem.updateMany({
        where: {
          userId,
          catalogItem: {
            type: inventoryItem.catalogItem.type,
          },
        },
        data: {
          isEquipped: false,
        },
      });

      await tx.inventoryItem.update({
        where: {
          id: inventoryItem.id,
        },
        data: {
          isEquipped: true,
        },
      });

      return {
        success: true,
      };
    });
  }

  async unequipItem(userId: number, type: 'skin' | 'trail' | 'effect' | 'title') {
    const updatedItems = await this.prisma.inventoryItem.updateMany({
      where: {
        userId,
        catalogItem: {
          type,
        },
        isEquipped: true,
      },
      data: {
        isEquipped: false,
      },
    });

    if (updatedItems.count === 0) {
      throw new BadRequestException('В этом слоте нет экипированного предмета');
    }

    return {
      success: true,
    };
  }
}
