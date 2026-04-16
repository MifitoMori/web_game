import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';

@Injectable()
export class AdminService {
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

  private readonly editableRoles: Role[] = [Role.USER, Role.ADMIN];

  async findAllUsers() {
    const gameUsers = await this.prisma.user.findMany({
      orderBy: { id: 'asc' },
      select: this.safeUserSelect,
    });

    return gameUsers.map((user) => {
      return {
        id: user.id,
        firstName: user.firstName,
        secondName: user.secondName,
        login: user.login,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      };
    });
  }

  async updateUserRole(params: {
    actorId: number;
    actorRole: Role;
    targetUserId: number;
    nextRole: Role;
  }) {
    const { actorId, actorRole, targetUserId, nextRole } = params;

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (!this.editableRoles.includes(nextRole)) {
      throw new BadRequestException(
        'Эту роль нельзя назначить через админ-панель',
      );
    }

    if (actorId === targetUserId) {
      throw new BadRequestException(
        'Нельзя изменить роль собственного аккаунта',
      );
    }

    if (targetUser.role === Role.SUPER_ADMIN) {
      throw new BadRequestException(
        'Роль супер админа меняется только вручную в базе данных',
      );
    }

    if (actorRole === Role.ADMIN) {
      const canPromoteUser =
        targetUser.role === Role.USER && nextRole === Role.ADMIN;

      if (!canPromoteUser) {
        throw new BadRequestException(
          'Админ может только назначить обычного пользователя админом',
        );
      }
    }

    if (actorRole !== Role.ADMIN && actorRole !== Role.SUPER_ADMIN) {
      throw new BadRequestException('Недостаточно прав для изменения роли');
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: nextRole },
    });
  }

  async findAllCatalogItems() {
    return this.prisma.catalogItem.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        rarity: true,
        type: true,
        price: true,
        currency: true,
      },
    });
  }

  async createCatalogItem(dto: CreateCatalogItemDto) {
    return this.prisma.catalogItem.create({
      data: dto,
    });
  }

  async updateCatalogItem(id: number, dto: UpdateCatalogItemDto) {
    const updatedItem = await this.prisma.catalogItem.findUnique({
      where: { id },
    });

    if (!updatedItem) {
      throw new NotFoundException('Предмет не найден');
    }

    return this.prisma.catalogItem.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCatalogItem(id: number) {
    const deletedItem = await this.prisma.catalogItem.findUnique({
      where: { id },
    });

    if (!deletedItem) {
      throw new NotFoundException('Предмет не найден');
    }

    return this.prisma.catalogItem.delete({
      where: { id },
    });
  }
}
