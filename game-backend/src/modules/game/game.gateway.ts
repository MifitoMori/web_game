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
import { createCorsOriginDelegate } from '../../common/cors';
import { PrismaService } from '../../prisma/prisma.service';
import { GameItem, GameService, PlayerGameState } from './game.service';

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

type PublicPlayerGameState = {
  userId: number;
  nickname: string;
  spawnIndex: number;
  hp: number;
  maxHp: number;
  ammo: number;
  maxAmmo: number;
  reserveAmmo: number;
  maxReserveAmmo: number;
  x: number;
  y: number;
  rotation: number;
};

type PublicPlayerPositionState = {
  userId: number;
  nickname: string;
  spawnIndex: number;
  x: number;
  y: number;
  rotation: number;
};

type PlayerUpdatePayload = {
  roomId: string;
  x: number;
  y: number;
  rotation: number;
};

type PlayerShootPayload = {
  roomId: string;
  bullet: {
    x: number;
    y: number;
    angle: number;
    id?: string;
  };
};

type PlayerHitPayload = {
  roomId: string;
  hitX: number;
  hitY: number;
};

type CollectItemPayload = {
  roomId: string;
  itemId: string;
};

const GAME_WORLD_LIMITS = {
  minX: 20,
  maxX: 4096,
  minY: 20,
  maxY: 4096,
  maxRotationAbs: Math.PI * 4,
};

const PLAYER_HIT_DAMAGE = 10;
const WIN_REWARD = {
  experience: 100,
  credits: 50,
};
const LOSS_REWARD = {
  experience: 25,
  credits: 10,
};

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
    origin: createCorsOriginDelegate(),
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

  private toPublicPlayerState(
    playerState: PlayerGameState | null,
  ): PublicPlayerGameState | null {
    if (!playerState) {
      return null;
    }

    return {
      userId: playerState.userId,
      nickname: playerState.nickname,
      spawnIndex: playerState.spawnIndex,
      hp: playerState.hp,
      maxHp: playerState.maxHp,
      ammo: playerState.ammo,
      maxAmmo: playerState.maxAmmo,
      reserveAmmo: playerState.reserveAmmo,
      maxReserveAmmo: playerState.maxReserveAmmo,
      x: playerState.position.x,
      y: playerState.position.y,
      rotation: playerState.position.rotation,
    };
  }

  private toPublicPlayerPositionState(
    playerState: PlayerGameState | null,
  ): PublicPlayerPositionState | null {
    if (!playerState) {
      return null;
    }

    return {
      userId: playerState.userId,
      nickname: playerState.nickname,
      spawnIndex: playerState.spawnIndex,
      x: playerState.position.x,
      y: playerState.position.y,
      rotation: playerState.position.rotation,
    };
  }

  private getPublicRoomPlayers(roomId: string): PublicPlayerGameState[] {
    const roomState = this.gameService.getRoomState(roomId);

    if (!roomState) {
      return [];
    }

    return Object.values(roomState.players)
      .map((playerState) => this.toPublicPlayerState(playerState))
      .filter((playerState): playerState is PublicPlayerGameState =>
        Boolean(playerState),
      );
  }

  private getPublicRoomItems(roomId: string): GameItem[] {
    return this.gameService.getRoomItems(roomId);
  }

  private validatePlayerUpdatePayload(
    data: PlayerUpdatePayload,
  ): data is PlayerUpdatePayload {
    if (!data?.roomId) {
      return false;
    }

    const { x, y, rotation } = data;

    return (
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      Number.isFinite(rotation) &&
      x >= GAME_WORLD_LIMITS.minX &&
      x <= GAME_WORLD_LIMITS.maxX &&
      y >= GAME_WORLD_LIMITS.minY &&
      y <= GAME_WORLD_LIMITS.maxY &&
      Math.abs(rotation) <= GAME_WORLD_LIMITS.maxRotationAbs
    );
  }

  private validatePlayerShootPayload(
    data: PlayerShootPayload,
  ): data is PlayerShootPayload {
    if (!data?.roomId || !data.bullet) {
      return false;
    }

    const { x, y, angle } = data.bullet;

    return (
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      Number.isFinite(angle) &&
      x >= GAME_WORLD_LIMITS.minX &&
      x <= GAME_WORLD_LIMITS.maxX &&
      y >= GAME_WORLD_LIMITS.minY &&
      y <= GAME_WORLD_LIMITS.maxY &&
      Math.abs(angle) <= GAME_WORLD_LIMITS.maxRotationAbs
    );
  }

  private validatePlayerHitPayload(
    data: PlayerHitPayload,
  ): data is PlayerHitPayload {
    if (!data?.roomId) {
      return false;
    }

    const { hitX, hitY } = data;

    return (
      Number.isFinite(hitX) &&
      Number.isFinite(hitY) &&
      hitX >= GAME_WORLD_LIMITS.minX &&
      hitX <= GAME_WORLD_LIMITS.maxX &&
      hitY >= GAME_WORLD_LIMITS.minY &&
      hitY <= GAME_WORLD_LIMITS.maxY
    );
  }

  private validateCollectItemPayload(
    data: CollectItemPayload,
  ): data is CollectItemPayload {
    return Boolean(data?.roomId && data.itemId);
  }

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

  private ensureGameStarted(client: AuthenticatedClient, roomId: string) {
    if (this.gameService.isRoomPlaying(roomId)) {
      return true;
    }

    client.emit('gameNotStarted', { roomId });
    return false;
  }

  private calculateLevel(experience: number) {
    let level = 1;

    while (experience >= (level + 1) * 250) {
      level += 1;
    }

    return level;
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

  async handleDisconnect(client: ClientWithUser) {
    this.logger.log(`Game socket disconnected: ${client.id}`);
    this.gameService.removeFromWaiting(client.id);

    const detached = this.gameService.detachGameSocket(client.id);

    if (detached && detached.room.status !== 'ended') {
      if (
        detached.room.status === 'playing' &&
        detached.opponent?.gameSocketId
      ) {
        await this.finishMatch(
          detached.room.id,
          detached.opponent.userId,
          detached.player.userId,
          'disconnect',
        );
        return;
      }

      client.to(detached.room.id).emit('opponentLeft');
      this.logger.log(
        `Player ${detached.player.nickname} detached from game room ${detached.room.id}`,
      );
    }
  }

  @SubscribeMessage('findMatch')
  handleFindMatch(
    @ConnectedSocket() client: ClientWithUser,
    @MessageBody() _data: unknown,
  ) {
    if (!this.ensureAuthenticated(client)) {
      return;
    }

    const activeRoom = this.gameService.getActiveRoomByUserId(client.userId);

    if (activeRoom) {
      client.emit('matchmakingRejected', {
        code: 'ALREADY_IN_MATCH',
        message: 'У вас уже есть активный матч',
      });
      return;
    }

    if (this.gameService.isUserWaiting(client.userId)) {
      client.emit('matchmakingRejected', {
        code: 'ALREADY_SEARCHING',
        message: 'Поиск матча уже запущен в другой вкладке или браузере',
      });
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
        player: this.toPublicPlayerState(
          this.gameService.getPlayerState(match.roomId, client.userId),
        ),
        opponent: this.toPublicPlayerState(
          this.gameService.getOpponentState(match.roomId, client.userId),
        ),
      });

      this.server.to(match.opponent.socketId).emit('matchFound', {
        roomId: match.roomId,
        player: this.toPublicPlayerState(
          this.gameService.getPlayerState(match.roomId, match.opponent.userId),
        ),
        opponent: this.toPublicPlayerState(
          this.gameService.getOpponentState(match.roomId, match.opponent.userId),
        ),
      });

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

  @SubscribeMessage('joinGameRoom')
  handleJoinGameRoom(
    @ConnectedSocket() client: ClientWithUser,
    @MessageBody() data: { roomId: string },
  ) {
    if (!this.ensureAuthenticated(client)) {
      return;
    }

    if (!data?.roomId) {
      client.emit('gameRoomJoinError', { message: 'roomId is required' });
      return;
    }

    const joinResult = this.gameService.attachGameSocket(
      data.roomId,
      client.userId,
      client.id,
    );

    if (!joinResult) {
      client.emit('gameRoomJoinError', { message: 'Game room not found' });
      return;
    }

    client.join(data.roomId);

    this.logger.log(
      `Player ${client.nickname} joined game room ${data.roomId} with socket ${client.id}`,
    );

    client.emit('gameRoomJoined', {
      roomId: data.roomId,
      player: this.toPublicPlayerState(joinResult.playerState),
      opponent: this.toPublicPlayerState(joinResult.opponentState),
      items: this.getPublicRoomItems(data.roomId),
      allPlayersConnected: joinResult.allGameSocketsJoined,
    });

    client.to(data.roomId).emit('opponentJoinedGameRoom', {
      userId: client.userId,
      nickname: client.nickname,
      allPlayersConnected: joinResult.allGameSocketsJoined,
    });

    if (
      joinResult.allGameSocketsJoined &&
      joinResult.room.status !== 'playing'
    ) {
      this.gameService.updateRoomStatus(data.roomId, 'playing');

      this.server.to(data.roomId).emit('gameStart', {
        roomId: data.roomId,
        players: this.getPublicRoomPlayers(data.roomId),
        items: this.getPublicRoomItems(data.roomId),
      });

      this.logger.log(`Game room ${data.roomId} started`);
    }
  }

  @SubscribeMessage('playerUpdate')
  handlePlayerUpdate(
    @ConnectedSocket() client: ClientWithUser,
    @MessageBody()
    data: PlayerUpdatePayload,
  ) {
    if (!this.ensureAuthenticated(client)) {
      return;
    }

    if (!this.validatePlayerUpdatePayload(data)) {
      client.emit('playerUpdateRejected', { message: 'Invalid player update' });
      return;
    }

    if (
      !this.gameService.isGameSocketParticipant(
        data.roomId,
        client.userId,
        client.id,
      )
    ) {
      client.emit('gameRoomJoinError', { message: 'Not a room participant' });
      return;
    }

    if (!this.ensureGameStarted(client, data.roomId)) {
      return;
    }

    const playerState = this.gameService.updatePlayerPosition(
      data.roomId,
      client.userId,
      {
        x: data.x,
        y: data.y,
        rotation: data.rotation,
      },
    );

    const publicState = this.toPublicPlayerPositionState(
      this.gameService.getPlayerState(data.roomId, client.userId) ?? playerState,
    );

    if (!publicState) {
      client.emit('gameRoomJoinError', { message: 'Room state not found' });
      return;
    }

    client.to(data.roomId).emit('opponentUpdate', publicState);
  }

  @SubscribeMessage('playerShoot')
  handlePlayerShoot(
    @ConnectedSocket() client: ClientWithUser,
    @MessageBody()
    data: PlayerShootPayload,
  ) {
    if (!this.ensureAuthenticated(client)) {
      return;
    }

    if (!this.validatePlayerShootPayload(data)) {
      client.emit('playerShootRejected', { message: 'Invalid shot' });
      return;
    }

    if (
      !this.gameService.isGameSocketParticipant(
        data.roomId,
        client.userId,
        client.id,
      )
    ) {
      client.emit('gameRoomJoinError', { message: 'Not a room participant' });
      return;
    }

    if (!this.ensureGameStarted(client, data.roomId)) {
      return;
    }

    const playerState = this.gameService.consumePlayerAmmo(
      data.roomId,
      client.userId,
    );

    if (!playerState) {
      client.emit('playerShootRejected', {
        message: 'Not enough ammo',
        ammo: 0,
      });
      return;
    }

    const confirmedBullet = {
      id: data.bullet.id ?? `${client.id}-${Date.now()}`,
      x: data.bullet.x,
      y: data.bullet.y,
      angle: data.bullet.angle,
      shooterId: client.userId,
    };

    client.emit('playerShootConfirmed', {
      bullet: confirmedBullet,
      ammo: playerState.ammo,
      maxAmmo: playerState.maxAmmo,
      reserveAmmo: playerState.reserveAmmo,
      maxReserveAmmo: playerState.maxReserveAmmo,
    });
    client.to(data.roomId).emit('opponentShot', confirmedBullet);
  }

  @SubscribeMessage('playerReload')
  handlePlayerReload(
    @ConnectedSocket() client: ClientWithUser,
    @MessageBody() data: { roomId: string },
  ) {
    if (!this.ensureAuthenticated(client)) {
      return;
    }

    if (!data?.roomId) {
      client.emit('playerReloadRejected', { message: 'roomId is required' });
      return;
    }

    if (
      !this.gameService.isGameSocketParticipant(
        data.roomId,
        client.userId,
        client.id,
      )
    ) {
      client.emit('gameRoomJoinError', { message: 'Not a room participant' });
      return;
    }

    if (!this.ensureGameStarted(client, data.roomId)) {
      return;
    }

    const playerState = this.gameService.reloadPlayerAmmo(
      data.roomId,
      client.userId,
    );

    if (!playerState) {
      client.emit('playerReloadRejected', { message: 'Room state not found' });
      return;
    }

    client.emit('playerReloadConfirmed', {
      ammo: playerState.ammo,
      maxAmmo: playerState.maxAmmo,
      reserveAmmo: playerState.reserveAmmo,
      maxReserveAmmo: playerState.maxReserveAmmo,
    });
  }

  private async updateMatchResult(winnerId: number, loserId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const [winner, loser] = await Promise.all([
        tx.user.findUnique({
          where: { id: winnerId },
          select: {
            profileId: true,
            profile: {
              select: {
                experience: true,
              },
            },
          },
        }),
        tx.user.findUnique({
          where: { id: loserId },
          select: {
            profileId: true,
            profile: {
              select: {
                experience: true,
              },
            },
          },
        }),
      ]);

      if (!winner?.profile || !loser?.profile) {
        throw new Error(`Profile not found for match result winner=${winnerId}, loser=${loserId}`);
      }

      const winnerExperience = winner.profile.experience + WIN_REWARD.experience;
      const loserExperience = loser.profile.experience + LOSS_REWARD.experience;

      await Promise.all([
        tx.profile.update({
          where: { id: winner.profileId },
          data: {
            totalGames: { increment: 1 },
            wins: { increment: 1 },
            experience: { increment: WIN_REWARD.experience },
            credits: { increment: WIN_REWARD.credits },
            level: this.calculateLevel(winnerExperience),
          },
        }),
        tx.profile.update({
          where: { id: loser.profileId },
          data: {
            totalGames: { increment: 1 },
            losses: { increment: 1 },
            experience: { increment: LOSS_REWARD.experience },
            credits: { increment: LOSS_REWARD.credits },
            level: this.calculateLevel(loserExperience),
          },
        }),
      ]);
    });

    this.logger.log(`Match result saved: winner=${winnerId}, loser=${loserId}`);
  }

  private async finishMatch(
    roomId: string,
    winnerId: number,
    loserId: number,
    reason: 'hp_zero' | 'leave' | 'disconnect',
  ) {
    this.gameService.updateRoomStatus(roomId, 'ended');

    try {
      await this.updateMatchResult(winnerId, loserId);
    } catch (error) {
      this.gameService.updateRoomStatus(roomId, 'playing');
      this.server.to(roomId).emit('gameEndError', {
        message: 'Failed to save match result',
      });
      this.logger.error(`Failed to save match result: ${error}`);
      return;
    }

    this.server.to(roomId).emit('gameEnd', {
      winnerId,
      loserId,
      reason,
    });
    this.gameService.removeRoom(roomId);
  }

  @SubscribeMessage('playerHit')
  async handlePlayerHit(
    @ConnectedSocket() client: ClientWithUser,
    @MessageBody()
    data: PlayerHitPayload,
  ) {
    if (!this.ensureAuthenticated(client)) {
      return;
    }

    if (!this.validatePlayerHitPayload(data)) {
      client.emit('playerHitRejected', { message: 'Invalid hit' });
      return;
    }

    if (
      !this.gameService.isGameSocketParticipant(
        data.roomId,
        client.userId,
        client.id,
      )
    ) {
      client.emit('gameRoomJoinError', { message: 'Not a room participant' });
      return;
    }

    if (!this.ensureGameStarted(client, data.roomId)) {
      return;
    }

    const damageResult = this.gameService.damagePlayer(
      data.roomId,
      client.userId,
      PLAYER_HIT_DAMAGE,
    );

    if (!damageResult) {
      client.emit('playerHitRejected', { message: 'Room state not found' });
      return;
    }

    client.emit('playerHitConfirmed', {
      damage: PLAYER_HIT_DAMAGE,
      hp: damageResult.playerState.hp,
      maxHp: damageResult.playerState.maxHp,
      hitX: data.hitX,
      hitY: data.hitY,
    });

    client.to(data.roomId).emit('opponentHit', {
      damage: PLAYER_HIT_DAMAGE,
      hp: damageResult.playerState.hp,
      maxHp: damageResult.playerState.maxHp,
      hitX: data.hitX,
      hitY: data.hitY,
    });

    if (damageResult.playerState.hp <= 0 && damageResult.opponentState) {
      await this.finishMatch(
        data.roomId,
        damageResult.opponentState.userId,
        damageResult.playerState.userId,
        'hp_zero',
      );
    }
  }

  @SubscribeMessage('collectItem')
  handleCollectItem(
    @ConnectedSocket() client: ClientWithUser,
    @MessageBody() data: CollectItemPayload,
  ) {
    if (!this.ensureAuthenticated(client)) {
      return;
    }

    if (!this.validateCollectItemPayload(data)) {
      client.emit('collectItemRejected', { message: 'Invalid item payload' });
      return;
    }

    if (
      !this.gameService.isGameSocketParticipant(
        data.roomId,
        client.userId,
        client.id,
      )
    ) {
      client.emit('gameRoomJoinError', { message: 'Not a room participant' });
      return;
    }

    if (!this.ensureGameStarted(client, data.roomId)) {
      return;
    }

    const collectResult = this.gameService.collectItem(
      data.roomId,
      client.userId,
      data.itemId,
    );

    if (!collectResult) {
      client.emit('collectItemRejected', { message: 'Item not found' });
      client.emit('itemsSync', {
        items: this.getPublicRoomItems(data.roomId),
      });
      return;
    }

    this.server.to(data.roomId).emit('itemCollected', {
      collectorId: client.userId,
      item: collectResult.item,
      player: this.toPublicPlayerState(collectResult.playerState),
    });
    this.server.to(data.roomId).emit('itemsSync', {
      items: collectResult.items,
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

    if (
      !this.gameService.isGameSocketParticipant(
        data.roomId,
        client.userId,
        client.id,
      )
    ) {
      client.emit('gameRoomJoinError', { message: 'Not a room participant' });
      return;
    }

    if (!this.ensureGameStarted(client, data.roomId)) {
      return;
    }

    client.emit('playerDeathRejected', {
      message: 'Game end is controlled by server HP',
    });
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: ClientWithUser,
    @MessageBody() data: { roomId: string },
  ) {
    if (!this.ensureAuthenticated(client)) {
      return;
    }

    if (
      !this.gameService.isGameSocketParticipant(
        data.roomId,
        client.userId,
        client.id,
      )
    ) {
      client.emit('gameRoomJoinError', { message: 'Not a room participant' });
      return;
    }

    const room = this.gameService.getRoom(data.roomId);
    const opponent = room?.players.find((player) => player.userId !== client.userId);

    client.leave(data.roomId);

    if (room?.status === 'playing' && opponent) {
      await this.finishMatch(data.roomId, opponent.userId, client.userId, 'leave');
      return;
    }

    client.to(data.roomId).emit('opponentLeft');
    this.gameService.removeRoom(data.roomId);
  }
}
