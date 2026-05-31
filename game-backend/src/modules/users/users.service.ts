import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendshipStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly SOLO_WIN_EXPERIENCE = 50;
  private readonly SOLO_LOSS_EXPERIENCE = 25;

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
        credits: true,
        experience: true,
        level: true,
      },
    },
  } as const;

  private calculateLevel(experience: number) {
    let level = 1;

    while (experience >= (level + 1) * 250) {
      level += 1;
    }

    return level;
  }

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
        inventoryItems: {
          create: [
            {
              catalogItem: {
                connect: { slug: 'hitman-skin' },
              },
              isEquipped: true,
            },
            {
              catalogItem: {
                connect: { slug: 'newcomer-title' },
              },
              isEquipped: true,
            },
          ],
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

  async updateSettings(userId: number, dto: UpdateSettingsDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        login: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const nextLogin = dto.login?.trim();
    const nextAvatarUrl = dto.avatarUrl?.trim();
    const data: {
      login?: string;
      avatarUrl?: string | null;
      passwordHash?: string;
    } = {};

    if (nextLogin && nextLogin !== user.login) {
      const existingUser = await this.prisma.user.findUnique({
        where: { login: nextLogin },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Этот login уже используется');
      }

      data.login = nextLogin;
    }

    if (dto.avatarUrl !== undefined) {
      data.avatarUrl = nextAvatarUrl || null;
    }

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Введите текущий пароль');
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        dto.currentPassword,
        user.passwordHash,
      );

      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Текущий пароль указан неверно');
      }

      data.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    }

    if (Object.keys(data).length === 0) {
      return this.getSafeById(userId);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
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
            credits: true,
            experience: true,
            level: true,
          },
        },
        inventoryItems: {
          where: {
            catalogItem: {
              type: {
                in: ['skin', 'title'],
              },
            },
          },
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

  async getPublicProfileView(viewerId: number, targetUserId: number) {
    if (viewerId === targetUserId) {
      throw new BadRequestException('Для своего профиля используйте /profile');
    }

    const friendship = await this.prisma.friendship.findFirst({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [
          { requesterId: viewerId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: viewerId },
        ],
      },
      select: {
        id: true,
      },
    });

    if (!friendship) {
      throw new ForbiddenException('Профиль доступен только друзьям');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        login: true,
        firstName: true,
        secondName: true,
        avatarUrl: true,
        createdAt: true,
        profile: {
          select: {
            totalGames: true,
            wins: true,
            losses: true,
            level: true,
          },
        },
        inventoryItems: {
          where: {
            isEquipped: true,
            catalogItem: {
              type: 'title',
            },
          },
          take: 1,
          select: {
            catalogItem: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user?.profile) {
      throw new NotFoundException('Профиль пользователя не найден');
    }

    return {
      user: {
        id: user.id,
        login: user.login,
        firstName: user.firstName,
        secondName: user.secondName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      profile: {
        ...user.profile,
        title: user.inventoryItems[0]?.catalogItem.name,
      },
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

  async recordSoloMatchResult(userId: number, result: 'victory' | 'defeat') {
    const rewardExperience =
      result === 'victory' ? this.SOLO_WIN_EXPERIENCE : this.SOLO_LOSS_EXPERIENCE;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        profileId: true,
        profile: {
          select: {
            experience: true,
          },
        },
      },
    });

    if (!user?.profile) {
      throw new NotFoundException('Профиль пользователя не найден');
    }

    const nextExperience = user.profile.experience + rewardExperience;
    const updatedProfile = await this.prisma.profile.update({
      where: { id: user.profileId },
      data: {
        totalGames: { increment: 1 },
        wins: result === 'victory' ? { increment: 1 } : undefined,
        losses: result === 'defeat' ? { increment: 1 } : undefined,
        experience: { increment: rewardExperience },
        level: this.calculateLevel(nextExperience),
      },
      select: {
        totalGames: true,
        wins: true,
        losses: true,
        credits: true,
        experience: true,
        level: true,
      },
    });

    return {
      success: true,
      result,
      rewards: {
        experience: rewardExperience,
        credits: 0,
      },
      profile: updatedProfile,
    };
  }
}
