import { Injectable } from '@nestjs/common';
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
}
