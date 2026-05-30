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
import { FriendshipStatus, Role } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { createCorsOriginDelegate } from '../../common/cors';
import { PrismaService } from '../../prisma/prisma.service';
import { GameItem, GameService, Player, PlayerGameState } from './game.service';

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

type GameInvite = {
  id: string;
  inviterId: number;
  inviterNickname: string;
  inviterSocketId: string;
  inviteeId: number;
  inviteeNickname: string;
  expiresAt: number;
  timeout: NodeJS.Timeout;
};

const GAME_WORLD_LIMITS = {
  minX: 20,
  maxX: 1280,
  minY: 20,
  maxY: 720,
  maxRotationAbs: Math.PI * 4,
};

const PLAYER_HIT_DAMAGE = 10;
const GAME_INVITE_TTL_MS = 60000;
const GAME_RECONNECT_GRACE_MS = 30000;
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
  private readonly connectedSocketsByUser = new Map<number, Set<string>>();
  private readonly gameInvites = new Map<string, GameInvite>();
  private readonly reconnectTimers = new Map<string, NodeJS.Timeout>();

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

  private addUserSocket(userId: number, socketId: string) {
    const sockets = this.connectedSocketsByUser.get(userId) ?? new Set<string>();
    sockets.add(socketId);
    this.connectedSocketsByUser.set(userId, sockets);
  }

  private removeUserSocket(userId: number | undefined, socketId: string) {
    if (!userId) {
      return;
    }

    const sockets = this.connectedSocketsByUser.get(userId);

    if (!sockets) {
      return;
    }

    sockets.delete(socketId);

    if (sockets.size === 0) {
      this.connectedSocketsByUser.delete(userId);
    }
  }

  private getUserSocketId(userId: number) {
    return Array.from(this.connectedSocketsByUser.get(userId) ?? [])[0];
  }

  private emitToUser(userId: number, event: string, payload: unknown) {
    for (const socketId of this.connectedSocketsByUser.get(userId) ?? []) {
      this.server.to(socketId).emit(event, payload);
    }
  }

  private clearGameInvite(inviteId: string) {
    const invite = this.gameInvites.get(inviteId);

    if (!invite) {
      return;
    }

    clearTimeout(invite.timeout);
    this.gameInvites.delete(inviteId);
  }

  private getReconnectTimerKey(roomId: string, userId: number) {
    return `${roomId}:${userId}`;
  }

  private clearReconnectTimer(roomId: string, userId: number) {
    const key = this.getReconnectTimerKey(roomId, userId);
    const timer = this.reconnectTimers.get(key);

    if (!timer) {
      return;
    }

    clearTimeout(timer);
    this.reconnectTimers.delete(key);
  }

  private clearRoomReconnectTimers(roomId: string) {
    for (const [key, timer] of this.reconnectTimers.entries()) {
      if (!key.startsWith(`${roomId}:`)) {
        continue;
      }

      clearTimeout(timer);
      this.reconnectTimers.delete(key);
    }
  }

  private startReconnectGracePeriod(
    roomId: string,
    disconnectedPlayer: Player,
    opponent: Player,
  ) {
    this.clearReconnectTimer(roomId, disconnectedPlayer.userId);

    const reconnectDeadline = Date.now() + GAME_RECONNECT_GRACE_MS;
    this.gameService.markPlayerDisconnected(
      roomId,
      disconnectedPlayer.userId,
      reconnectDeadline,
    );

    const key = this.getReconnectTimerKey(roomId, disconnectedPlayer.userId);
    const timer = setTimeout(async () => {
      this.reconnectTimers.delete(key);

      const room = this.gameService.getRoom(roomId);

      if (!room || room.status !== 'playing') {
        return;
      }

      await this.finishMatch(
        roomId,
        opponent.userId,
        disconnectedPlayer.userId,
        'disconnect',
      );
    }, GAME_RECONNECT_GRACE_MS);

    this.reconnectTimers.set(key, timer);
    this.server.to(roomId).emit('opponentDisconnected', {
      userId: disconnectedPlayer.userId,
      nickname: disconnectedPlayer.nickname,
      reconnectDeadline,
    });
    this.logger.log(
      `Player ${disconnectedPlayer.nickname} disconnected from room ${roomId}; waiting ${GAME_RECONNECT_GRACE_MS}ms for reconnect`,
    );
  }

  private findActiveInviteBetween(userAId: number, userBId: number) {
    return Array.from(this.gameInvites.values()).find(
      (invite) =>
        ((invite.inviterId === userAId && invite.inviteeId === userBId) ||
          (invite.inviterId === userBId && invite.inviteeId === userAId)) &&
        invite.expiresAt > Date.now(),
    );
  }

  private emitMatchFoundToPlayer(roomId: string, player: Player) {
    this.server.to(player.socketId).emit('matchFound', {
      roomId,
      player: this.toPublicPlayerState(
        this.gameService.getPlayerState(roomId, player.userId),
      ),
      opponent: this.toPublicPlayerState(
        this.gameService.getOpponentState(roomId, player.userId),
      ),
    });
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

  private ensureGameplayAvailable(
    client: AuthenticatedClient,
    roomId: string,
    rejectedEvent?: string,
  ) {
    if (!this.gameService.isRoomWaitingForReconnect(roomId)) {
      return true;
    }

    if (rejectedEvent) {
      client.emit(rejectedEvent, {
        message: 'Game is paused while opponent reconnects',
      });
    }

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

    if (!client.userId) {
      client.emit('authError', { message: 'Unauthorized' });
      client.disconnect(true);
      return;
    }

    this.addUserSocket(client.userId, client.id);
    this.logger.log(`Game socket connected: ${client.nickname} (${client.id})`);
    client.emit('authSuccess', {
      userId: client.userId,
      nickname: client.nickname,
    });
  }

  async handleDisconnect(client: ClientWithUser) {
    this.logger.log(`Game socket disconnected: ${client.id}`);
    this.removeUserSocket(client.userId, client.id);
    this.gameService.removeFromWaiting(client.id);

    const detached = this.gameService.detachGameSocket(client.id);

    if (detached && detached.room.status !== 'ended') {
      if (detached.room.status === 'playing' && detached.opponent) {
        this.startReconnectGracePeriod(
          detached.room.id,
          detached.player,
          detached.opponent,
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

  @SubscribeMessage('inviteFriendToGame')
  async handleInviteFriendToGame(
    @ConnectedSocket() client: ClientWithUser,
    @MessageBody() data: { friendId: number },
  ) {
    if (!this.ensureAuthenticated(client)) {
      return;
    }

    const friendId = Number(data?.friendId);

    if (!Number.isInteger(friendId) || friendId <= 0 || friendId === client.userId) {
      client.emit('gameInviteRejected', { message: 'Некорректный игрок для приглашения' });
      return;
    }

    const friendship = await this.prisma.friendship.findFirst({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [
          { requesterId: client.userId, addresseeId: friendId },
          { requesterId: friendId, addresseeId: client.userId },
        ],
      },
      select: { id: true },
    });

    if (!friendship) {
      client.emit('gameInviteRejected', { message: 'Приглашать в игру можно только друзей' });
      return;
    }

    if (this.gameService.getActiveRoomByUserId(client.userId)) {
      client.emit('gameInviteRejected', { message: 'У вас уже есть активный матч' });
      return;
    }

    if (this.gameService.getActiveRoomByUserId(friendId)) {
      client.emit('gameInviteRejected', { message: 'Друг уже находится в матче' });
      return;
    }

    if (this.gameService.isUserWaiting(client.userId)) {
      client.emit('gameInviteRejected', { message: 'Остановите поиск матча перед приглашением' });
      return;
    }

    if (this.gameService.isUserWaiting(friendId)) {
      client.emit('gameInviteRejected', { message: 'Друг уже ищет матч' });
      return;
    }

    const inviteeSocketId = this.getUserSocketId(friendId);

    if (!inviteeSocketId) {
      client.emit('gameInviteRejected', { message: 'Друг сейчас не в сети' });
      return;
    }

    if (this.findActiveInviteBetween(client.userId, friendId)) {
      client.emit('gameInviteRejected', { message: 'Приглашение уже отправлено' });
      return;
    }

    const friend = await this.prisma.user.findUnique({
      where: { id: friendId },
      select: { login: true },
    });

    if (!friend) {
      client.emit('gameInviteRejected', { message: 'Друг не найден' });
      return;
    }

    const inviteId = `invite_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const expiresAt = Date.now() + GAME_INVITE_TTL_MS;
    const timeout = setTimeout(() => {
      this.gameInvites.delete(inviteId);
      client.emit('gameInviteExpired', { inviteId });
      this.emitToUser(friendId, 'gameInviteExpired', { inviteId });
    }, GAME_INVITE_TTL_MS);

    this.gameInvites.set(inviteId, {
      id: inviteId,
      inviterId: client.userId,
      inviterNickname: client.nickname,
      inviterSocketId: client.id,
      inviteeId: friendId,
      inviteeNickname: friend.login,
      expiresAt,
      timeout,
    });

    client.emit('gameInviteSent', {
      inviteId,
      friendId,
      friendNickname: friend.login,
      expiresAt,
    });
    this.emitToUser(friendId, 'gameInviteReceived', {
      inviteId,
      expiresAt,
      inviter: {
        id: client.userId,
        nickname: client.nickname,
      },
    });
  }

  @SubscribeMessage('declineGameInvite')
  handleDeclineGameInvite(
    @ConnectedSocket() client: ClientWithUser,
    @MessageBody() data: { inviteId: string },
  ) {
    if (!this.ensureAuthenticated(client)) {
      return;
    }

    const invite = this.gameInvites.get(data?.inviteId);

    if (!invite || invite.inviteeId !== client.userId) {
      return;
    }

    this.clearGameInvite(invite.id);
    this.server.to(invite.inviterSocketId).emit('gameInviteDeclined', {
      inviteId: invite.id,
      friendId: client.userId,
      friendNickname: client.nickname,
    });
  }

  @SubscribeMessage('acceptGameInvite')
  handleAcceptGameInvite(
    @ConnectedSocket() client: ClientWithUser,
    @MessageBody() data: { inviteId: string },
  ) {
    if (!this.ensureAuthenticated(client)) {
      return;
    }

    const invite = this.gameInvites.get(data?.inviteId);

    if (!invite || invite.inviteeId !== client.userId || invite.expiresAt <= Date.now()) {
      client.emit('gameInviteRejected', { message: 'Приглашение больше недействительно' });
      return;
    }

    if (
      this.gameService.getActiveRoomByUserId(invite.inviterId) ||
      this.gameService.getActiveRoomByUserId(invite.inviteeId) ||
      this.gameService.isUserWaiting(invite.inviterId) ||
      this.gameService.isUserWaiting(invite.inviteeId)
    ) {
      this.clearGameInvite(invite.id);
      client.emit('gameInviteRejected', { message: 'Нельзя начать матч: один из игроков уже занят' });
      this.server.to(invite.inviterSocketId).emit('gameInviteRejected', {
        message: 'Нельзя начать матч: один из игроков уже занят',
      });
      return;
    }

    const inviterSocketId =
      this.connectedSocketsByUser.get(invite.inviterId)?.has(invite.inviterSocketId)
        ? invite.inviterSocketId
        : this.getUserSocketId(invite.inviterId);

    if (!inviterSocketId) {
      this.clearGameInvite(invite.id);
      client.emit('gameInviteRejected', { message: 'Пригласивший игрок вышел из сети' });
      return;
    }

    this.clearGameInvite(invite.id);

    const inviterPlayer: Player = {
      socketId: inviterSocketId,
      userId: invite.inviterId,
      nickname: invite.inviterNickname,
      joinedAt: Date.now(),
    };
    const inviteePlayer: Player = {
      socketId: client.id,
      userId: client.userId,
      nickname: client.nickname,
      joinedAt: Date.now(),
    };
    const { roomId } = this.gameService.createDirectMatch(inviterPlayer, inviteePlayer);

    this.emitMatchFoundToPlayer(roomId, inviterPlayer);
    this.emitMatchFoundToPlayer(roomId, inviteePlayer);
  }

  @SubscribeMessage('checkActiveMatch')
  handleCheckActiveMatch(
    @ConnectedSocket() client: ClientWithUser,
    @MessageBody() data: { roomId: string },
  ) {
    if (!this.ensureAuthenticated(client)) {
      return;
    }

    if (!data?.roomId) {
      client.emit('activeMatchStatus', {
        exists: false,
        message: 'roomId is required',
      });
      return;
    }

    const room = this.gameService.getRoom(data.roomId);
    const isParticipant = room?.players.some(
      (player) => player.userId === client.userId,
    );

    client.emit('activeMatchStatus', {
      roomId: data.roomId,
      exists: !!room && room.status !== 'ended' && !!isParticipant,
      status: room?.status,
      message:
        room && isParticipant
          ? undefined
          : 'Комната матча больше недоступна',
    });
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

    const wasReconnecting = this.gameService.clearPlayerDisconnected(
      data.roomId,
      client.userId,
    );

    if (wasReconnecting) {
      this.clearReconnectTimer(data.roomId, client.userId);
      client.to(data.roomId).emit('opponentReconnected', {
        userId: client.userId,
        nickname: client.nickname,
      });
    }

    this.logger.log(
      `Player ${client.nickname} joined game room ${data.roomId} with socket ${client.id}`,
    );

    const disconnectedPlayer = this.gameService.getDisconnectedPlayer(data.roomId);

    client.emit('gameRoomJoined', {
      roomId: data.roomId,
      status: joinResult.room.status,
      player: this.toPublicPlayerState(joinResult.playerState),
      opponent: this.toPublicPlayerState(joinResult.opponentState),
      items: this.getPublicRoomItems(data.roomId),
      allPlayersConnected: joinResult.allGameSocketsJoined,
      reconnectingPlayer: disconnectedPlayer
        ? {
            userId: disconnectedPlayer.userId,
            nickname: disconnectedPlayer.nickname,
            reconnectDeadline: disconnectedPlayer.reconnectDeadline,
          }
        : null,
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

    if (!this.ensureGameplayAvailable(client, data.roomId)) {
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

    if (!this.ensureGameplayAvailable(client, data.roomId, 'playerShootRejected')) {
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

    if (this.gameService.isRoomWaitingForReconnect(data.roomId)) {
      const playerState = this.gameService.getPlayerState(data.roomId, client.userId);

      client.emit('playerReloadRejected', {
        message: 'Game is paused while opponent reconnects',
        ammo: playerState?.ammo,
        maxAmmo: playerState?.maxAmmo,
        reserveAmmo: playerState?.reserveAmmo,
        maxReserveAmmo: playerState?.maxReserveAmmo,
      });
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

    this.clearRoomReconnectTimers(roomId);
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

    if (!this.ensureGameplayAvailable(client, data.roomId, 'playerHitRejected')) {
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

    if (!this.ensureGameplayAvailable(client, data.roomId, 'collectItemRejected')) {
      client.emit('itemsSync', {
        items: this.getPublicRoomItems(data.roomId),
      });
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

    if (!this.ensureGameplayAvailable(client, data.roomId, 'playerDeathRejected')) {
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
