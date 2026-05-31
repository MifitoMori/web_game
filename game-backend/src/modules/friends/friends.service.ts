import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendshipStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type FriendUser = {
  id: number;
  login: string;
  avatarUrl: string | null;
  inventoryItems?: Array<{
    catalogItem: {
      name: string;
    };
  }>;
  profile: {
    level: number;
  } | null;
};

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly userCardSelect = {
    id: true,
    login: true,
    avatarUrl: true,
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
    profile: {
      select: {
        level: true,
      },
    },
  } as const;

  private mapUser(user: FriendUser) {
    return {
      id: user.id.toString(),
      nickname: user.login,
      title: user.inventoryItems?.[0]?.catalogItem.name,
      level: user.profile?.level ?? 1,
      avatar: user.avatarUrl ?? undefined,
    };
  }

  private mapFriend(user: FriendUser, friendshipDate: Date) {
    return {
      ...this.mapUser(user),
      friendshipDate,
    };
  }

  async getFriends(userId: number) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        requester: {
          select: this.userCardSelect,
        },
        addressee: {
          select: this.userCardSelect,
        },
      },
    });

    return friendships.map((friendship) => {
      const friend =
        friendship.requesterId === userId
          ? friendship.addressee
          : friendship.requester;

      return this.mapFriend(friend, friendship.updatedAt);
    });
  }

  async getFriendRequests(userId: number) {
    const [incoming, outgoing] = await Promise.all([
      this.prisma.friendship.findMany({
        where: {
          addresseeId: userId,
          status: FriendshipStatus.PENDING,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          requester: {
            select: this.userCardSelect,
          },
        },
      }),
      this.prisma.friendship.findMany({
        where: {
          requesterId: userId,
          status: FriendshipStatus.PENDING,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          addressee: {
            select: this.userCardSelect,
          },
        },
      }),
    ]);

    return {
      incoming: incoming.map((request) => ({
        id: request.id,
        createdAt: request.createdAt,
        user: this.mapUser(request.requester),
      })),
      outgoing: outgoing.map((request) => ({
        id: request.id,
        createdAt: request.createdAt,
        user: this.mapUser(request.addressee),
      })),
    };
  }

  async searchUsers(userId: number, query: string) {
    const searchQuery = query.trim();

    if (!searchQuery) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: {
          not: userId,
        },
        OR: [
          { login: { contains: searchQuery, mode: 'insensitive' } },
          { firstName: { contains: searchQuery, mode: 'insensitive' } },
          { secondName: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
      orderBy: {
        login: 'asc',
      },
      take: 50,
      select: this.userCardSelect,
    });

    const userIds = users.map((user) => user.id);

    const friendships = userIds.length
      ? await this.prisma.friendship.findMany({
          where: {
            OR: [
              {
                requesterId: userId,
                addresseeId: {
                  in: userIds,
                },
              },
              {
                requesterId: {
                  in: userIds,
                },
                addresseeId: userId,
              },
            ],
          },
        })
      : [];

    return users.map((user) => {
      const friendship = friendships.find(
        (item) =>
          (item.requesterId === userId && item.addresseeId === user.id) ||
          (item.requesterId === user.id && item.addresseeId === userId),
      );

      let relationshipStatus: 'NONE' | 'FRIEND' | 'OUTGOING' | 'INCOMING' =
        'NONE';

      if (friendship?.status === FriendshipStatus.ACCEPTED) {
        relationshipStatus = 'FRIEND';
      } else if (
        friendship?.status === FriendshipStatus.PENDING &&
        friendship.requesterId === userId
      ) {
        relationshipStatus = 'OUTGOING';
      } else if (
        friendship?.status === FriendshipStatus.PENDING &&
        friendship.addresseeId === userId
      ) {
        relationshipStatus = 'INCOMING';
      }

      return {
        ...this.mapUser(user),
        relationshipStatus,
        requestId:
          relationshipStatus === 'OUTGOING' || relationshipStatus === 'INCOMING'
            ? friendship?.id
            : undefined,
      };
    });
  }

  async sendFriendRequest(requesterId: number, addresseeId: number) {
    if (requesterId === addresseeId) {
      throw new BadRequestException('Нельзя добавить в друзья самого себя');
    }

    const addressee = await this.prisma.user.findUnique({
      where: {
        id: addresseeId,
      },
      select: {
        id: true,
      },
    });

    if (!addressee) {
      throw new NotFoundException('Пользователь не найден');
    }

    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    });

    if (existingFriendship?.status === FriendshipStatus.ACCEPTED) {
      throw new BadRequestException('Пользователь уже в друзьях');
    }

    if (existingFriendship?.status === FriendshipStatus.PENDING) {
      throw new BadRequestException(
        existingFriendship.requesterId === requesterId
          ? 'Заявка уже отправлена'
          : 'У вас уже есть входящая заявка от этого пользователя',
      );
    }

    if (existingFriendship?.status === FriendshipStatus.BLOCKED) {
      throw new BadRequestException('Нельзя отправить заявку этому пользователю');
    }

    const friendship = existingFriendship
      ? await this.prisma.friendship.update({
          where: {
            id: existingFriendship.id,
          },
          data: {
            requesterId,
            addresseeId,
            status: FriendshipStatus.PENDING,
          },
          include: {
            addressee: {
              select: this.userCardSelect,
            },
          },
        })
      : await this.prisma.friendship.create({
          data: {
            requesterId,
            addresseeId,
          },
          include: {
            addressee: {
              select: this.userCardSelect,
            },
          },
        });

    return {
      id: friendship.id,
      createdAt: friendship.createdAt,
      user: this.mapUser(friendship.addressee),
    };
  }

  async acceptFriendRequest(userId: number, requestId: number) {
    const request = await this.prisma.friendship.findFirst({
      where: {
        id: requestId,
        addresseeId: userId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        requester: {
          select: this.userCardSelect,
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Заявка в друзья не найдена');
    }

    const friendship = await this.prisma.friendship.update({
      where: {
        id: request.id,
      },
      data: {
        status: FriendshipStatus.ACCEPTED,
      },
      include: {
        requester: {
          select: this.userCardSelect,
        },
      },
    });

    return this.mapFriend(friendship.requester, friendship.updatedAt);
  }

  async declineFriendRequest(userId: number, requestId: number) {
    const request = await this.prisma.friendship.findFirst({
      where: {
        id: requestId,
        addresseeId: userId,
        status: FriendshipStatus.PENDING,
      },
    });

    if (!request) {
      throw new NotFoundException('Заявка в друзья не найдена');
    }

    await this.prisma.friendship.update({
      where: {
        id: request.id,
      },
      data: {
        status: FriendshipStatus.DECLINED,
      },
    });

    return {
      success: true,
    };
  }

  async cancelFriendRequest(userId: number, requestId: number) {
    const request = await this.prisma.friendship.findFirst({
      where: {
        id: requestId,
        requesterId: userId,
        status: FriendshipStatus.PENDING,
      },
    });

    if (!request) {
      throw new NotFoundException('Исходящая заявка в друзья не найдена');
    }

    await this.prisma.friendship.delete({
      where: {
        id: request.id,
      },
    });

    return {
      success: true,
    };
  }

  async removeFriend(userId: number, friendUserId: number) {
    if (userId === friendUserId) {
      throw new BadRequestException('Нельзя удалить из друзей самого себя');
    }

    const friendship = await this.prisma.friendship.findFirst({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [
          { requesterId: userId, addresseeId: friendUserId },
          { requesterId: friendUserId, addresseeId: userId },
        ],
      },
    });

    if (!friendship) {
      throw new NotFoundException('Дружба не найдена');
    }

    await this.prisma.friendship.delete({
      where: {
        id: friendship.id,
      },
    });

    return {
      success: true,
    };
  }
}
