import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';
import { GameService } from './game.service';

const ACCESS_TOKEN_COOKIE = 'access_token';

type AuthPayload = {
  sub: number;
  login: string;
  role: Role;
};

interface ClientWithUser extends Socket {
  userId?: number;
  nickname?: string;
  role?: Role;
}

type AuthenticatedClient = ClientWithUser & {
  userId: number;
  nickname: string;
};

const getAllowedOrigins = () =>
  (
    process.env.CORS_ORIGINS ??
    'http://localhost:3000,http://localhost:5173,http://localhost:8080,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:8080'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const getCookieValue = (cookieHeader: string | undefined, name: string) => {
  if (!cookieHeader) {
    return undefined;
  }

  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .map((cookie) => {
      const separatorIndex = cookie.indexOf('=');

      if (separatorIndex === -1) {
        return null;
      }

      return {
        name: cookie.slice(0, separatorIndex),
        value: cookie.slice(separatorIndex + 1),
      };
    })
    .filter((cookie): cookie is { name: string; value: string } =>
      Boolean(cookie),
    )
    .find((cookie) => cookie.name === name)?.value;
};

@WebSocketGateway({
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
  },
  namespace: 'game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);

  constructor(
    private readonly gameService: GameService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private async authenticateClient(client: ClientWithUser) {
    const token = getCookieValue(
      client.handshake.headers.cookie,
      ACCESS_TOKEN_COOKIE,
    );

    if (!token) {
      return false;
    }

    let payload: AuthPayload;

    try {
      payload = await this.jwtService.verifyAsync<AuthPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET', 'dev-secret-key'),
      });
    } catch {
      return false;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        login: true,
        role: true,
      },
    });

    if (!user) {
      return false;
    }

    client.userId = user.id;
    client.nickname = user.login;
    client.role = user.role;

    return true;
  }

  private ensureAuthenticated(
    client: ClientWithUser,
  ): client is AuthenticatedClient {
    if (client.userId && client.nickname) {
      return true;
    }

    client.emit('authError', { message: 'Unauthorized' });
    client.disconnect(true);

    return false;
  }

  async handleConnection(client: ClientWithUser) {
    const isAuthenticated = await this.authenticateClient(client);

    if (!isAuthenticated) {
      this.logger.warn(`Unauthorized game socket: ${client.id}`);
      client.emit('authError', { message: 'Unauthorized' });
      client.disconnect(true);
      return;
    }

    this.logger.log(`Game socket connected: ${client.nickname} (${client.id})`);
    client.emit('authSuccess', {
      userId: client.userId,
      nickname: client.nickname,
    });
  }

  handleDisconnect(client: ClientWithUser) {
    this.logger.log(`Game socket disconnected: ${client.id}`);
    this.gameService.removeFromWaiting(client.id);
  }

  @SubscribeMessage('findMatch')
  handleFindMatch(
    @ConnectedSocket() client: ClientWithUser,
    @MessageBody() _data: unknown,
  ) {
    if (!this.ensureAuthenticated(client)) {
      return;
    }

    this.logger.log(`Player ${client.nickname} is searching for a match`);

    const player = {
      socketId: client.id,
      userId: client.userId,
      nickname: client.nickname,
      joinedAt: Date.now(),
    };

    const match = this.gameService.findMatch(player);

    if (match.found) {
      client.join(match.roomId);
      this.logger.log(
        `Player ${client.nickname} joined room ${match.roomId}`,
      );

      client.emit('matchFound', {
        roomId: match.roomId,
        opponent: match.opponent,
      });

      this.server.to(match.opponent.socketId).emit('matchFound', {
        roomId: match.roomId,
        opponent: {
          socketId: client.id,
          userId: client.userId,
          nickname: client.nickname,
        },
      });

      this.gameService.updateRoomStatus(match.roomId, 'playing');
      return;
    }

    const { timeout } = this.gameService.addToWaiting(player);
    client.emit('waitingForPlayer', { timeout });
  }

  @SubscribeMessage('cancelSearch')
  handleCancelSearch(@ConnectedSocket() client: ClientWithUser) {
    if (!this.ensureAuthenticated(client)) {
      return;
    }

    const removed = this.gameService.removeFromWaiting(client.id);

    if (removed) {
      client.emit('searchCancelled');
      this.logger.log(`Player ${client.nickname} cancelled matchmaking`);
    }
  }

  @SubscribeMessage('playerUpdate')
  handlePlayerUpdate(
    @ConnectedSocket() client: ClientWithUser,
    @MessageBody()
    data: {
      roomId: string;
      x: number;
      y: number;
      rotation: number;
      hp: number;
      ammo: number;
    },
  ) {
    if (!this.ensureAuthenticated(client)) {
      return;
    }

    client.to(data.roomId).emit('opponentUpdate', {
      x: data.x,
      y: data.y,
      rotation: data.rotation,
      hp: data.hp,
      ammo: data.ammo,
    });
  }

  @SubscribeMessage('playerShoot')
  handlePlayerShoot(
    @ConnectedSocket() client: ClientWithUser,
    @MessageBody()
    data: { roomId: string; bullet: { x: number; y: number; angle: number; id: string } },
  ) {
    if (!this.ensureAuthenticated(client)) {
      return;
    }

    client.to(data.roomId).emit('opponentShot', data.bullet);
  }

  @SubscribeMessage('playerHit')
  handlePlayerHit(
    @ConnectedSocket() client: ClientWithUser,
    @MessageBody()
    data: {
      roomId: string;
      damage: number;
      newHp: number;
      hitX: number;
      hitY: number;
    },
  ) {
    if (!this.ensureAuthenticated(client)) {
      return;
    }

    client.to(data.roomId).emit('opponentHit', {
      damage: data.damage,
      newHp: data.newHp,
      hitX: data.hitX,
      hitY: data.hitY,
    });
  }

  @SubscribeMessage('playerDeath')
  handlePlayerDeath(
    @ConnectedSocket() client: ClientWithUser,
    @MessageBody() data: { roomId: string; winnerId: number },
  ) {
    if (!this.ensureAuthenticated(client)) {
      return;
    }

    this.server.to(data.roomId).emit('gameEnd', { winnerId: data.winnerId });
    this.gameService.removeRoom(data.roomId);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: ClientWithUser,
    @MessageBody() data: { roomId: string },
  ) {
    if (!this.ensureAuthenticated(client)) {
      return;
    }

    client.leave(data.roomId);
    client.to(data.roomId).emit('opponentLeft');
    this.gameService.removeRoom(data.roomId);
  }
}
