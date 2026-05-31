import { Injectable, Logger } from '@nestjs/common';

export interface Player {
  socketId: string;
  userId: number;
  nickname: string;
  title?: string;
  joinedAt: number;
  gameSocketId?: string;
  disconnectedAt?: number;
  reconnectDeadline?: number;
}

export interface PlayerPosition {
  x: number;
  y: number;
  rotation: number;
}

export interface PlayerGameState {
  userId: number;
  nickname: string;
  title?: string;
  lobbySocketId: string;
  gameSocketId?: string;
  spawnIndex: number;
  hp: number;
  maxHp: number;
  ammo: number;
  maxAmmo: number;
  reserveAmmo: number;
  maxReserveAmmo: number;
  position: PlayerPosition;
  lastUpdateAt: number;
  disconnectedAt?: number;
  reconnectDeadline?: number;
}

export type GameItemType = 'health' | 'ammo';

export interface GameItem {
  id: string;
  type: GameItemType;
  x: number;
  y: number;
}

export interface GameRoomState {
  players: Record<number, PlayerGameState>;
  socketToUserId: Record<string, number>;
  items: Record<string, GameItem>;
  itemSpawnCursor: number;
}

export interface GameRoom {
  id: string;
  players: Player[];
  createdAt: number;
  status: 'waiting' | 'playing' | 'ended';
  state: GameRoomState;
}

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  
  private waitingPlayers: Map<string, Player> = new Map();
  private activeRooms: Map<string, GameRoom> = new Map();
  
  private readonly SEARCH_TIMEOUT = 30000; // 30 секунд
  private readonly ROOM_INACTIVE_TIMEOUT = 5000; // 5 секунд

  private readonly PLAYER_MAX_HP = 100;
  private readonly PLAYER_MAX_AMMO = 30;
  private readonly PLAYER_MAX_RESERVE_AMMO = 30;
  private readonly HEALTH_PACK_AMOUNT = 20;
  private readonly AMMO_PACK_AMOUNT = 10;
  private readonly MAX_ITEMS_ON_MAP = 4;
  private readonly DEFAULT_SPAWNS: PlayerPosition[] = [
    { x: 100, y: 360, rotation: 0 },
    { x: 1130, y: 360, rotation: Math.PI },
  ];
  private readonly ITEM_SPAWN_POINTS: Array<Omit<GameItem, 'id'>> = [
    { type: 'health', x: 360, y: 180 },
    { type: 'ammo', x: 870, y: 180 },
    { type: 'health', x: 360, y: 540 },
    { type: 'ammo', x: 870, y: 540 },
    { type: 'health', x: 615, y: 180 },
    { type: 'ammo', x: 615, y: 540 },
  ];

  addToWaiting(player: Player): { status: 'waiting'; timeout: number } {
    this.waitingPlayers.set(player.socketId, player);
    this.logger.log(`Игрок ${player.nickname} добавлен в очередь ожидания`);
    
    // Таймаут автоматического удаления из очереди
    setTimeout(() => {
      if (this.waitingPlayers.has(player.socketId)) {
        this.waitingPlayers.delete(player.socketId);
        this.logger.log(`Игрок ${player.nickname} удален из очереди (таймаут)`);
      }
    }, this.SEARCH_TIMEOUT);
    
    return { status: 'waiting', timeout: this.SEARCH_TIMEOUT };
  }

  getWaitingPlayerByUserId(userId: number): Player | undefined {
    return Array.from(this.waitingPlayers.values()).find(
      (player) => player.userId === userId,
    );
  }

  isUserWaiting(userId: number): boolean {
    return !!this.getWaitingPlayerByUserId(userId);
  }

  getActiveRoomByUserId(userId: number): GameRoom | undefined {
    return Array.from(this.activeRooms.values()).find(
      (room) =>
        room.status !== 'ended' &&
        room.players.some((player) => player.userId === userId),
    );
  }

  findMatch(player: Player): { found: true; roomId: string; opponent: Player } | { found: false } {
    // Ищем ожидающего игрока (не самого себя)
    for (const [socketId, waitingPlayer] of this.waitingPlayers.entries()) {
      if (socketId !== player.socketId && waitingPlayer.userId !== player.userId) {
        // Удаляем оппонента из очереди
        this.waitingPlayers.delete(socketId);
        
        // Создаем комнату
        const room = this.createMatchRoom([waitingPlayer, player]);
        const roomId = room.id;
        this.logger.log(`Создана комната ${roomId} для игроков ${waitingPlayer.nickname} и ${player.nickname}`);
        
        return { found: true, roomId, opponent: waitingPlayer };
      }
    }
    
    return { found: false };
  }

  createDirectMatch(playerA: Player, playerB: Player): { roomId: string } {
    const room = this.createMatchRoom([playerA, playerB]);
    this.logger.log(
      `Создана комната ${room.id} по приглашению для игроков ${playerA.nickname} и ${playerB.nickname}`,
    );

    return { roomId: room.id };
  }

  removeFromWaiting(socketId: string): boolean {
    return this.waitingPlayers.delete(socketId);
  }

  getRoom(roomId: string): GameRoom | undefined {
    return this.activeRooms.get(roomId);
  }

  attachGameSocket(roomId: string, userId: number, gameSocketId: string) {
    const room = this.activeRooms.get(roomId);

    if (!room || room.status === 'ended') {
      return null;
    }

    const player = room.players.find((item) => item.userId === userId);

    if (!player) {
      return null;
    }

    if (player.gameSocketId) {
      delete room.state.socketToUserId[player.gameSocketId];
    }

    player.gameSocketId = gameSocketId;

    const playerState = room.state.players[player.userId];

    if (playerState) {
      playerState.gameSocketId = gameSocketId;
      playerState.lastUpdateAt = Date.now();
    }

    room.state.socketToUserId[gameSocketId] = player.userId;

    return {
      room,
      player,
      playerState: this.clonePlayerState(playerState),
      opponent: room.players.find((item) => item.userId !== userId),
      opponentState: this.getOpponentState(roomId, userId),
      allGameSocketsJoined: room.players.every((item) => item.gameSocketId),
    };
  }

  detachGameSocket(gameSocketId: string) {
    for (const room of this.activeRooms.values()) {
      const player = room.players.find((item) => item.gameSocketId === gameSocketId);

      if (player) {
        player.gameSocketId = undefined;

        const playerState = room.state.players[player.userId];

        if (playerState) {
          playerState.gameSocketId = undefined;
          playerState.lastUpdateAt = Date.now();
        }

        delete room.state.socketToUserId[gameSocketId];

        return {
          room,
          player,
          opponent: room.players.find((item) => item.userId !== player.userId),
        };
      }
    }

    return null;
  }

  markPlayerDisconnected(
    roomId: string,
    userId: number,
    reconnectDeadline: number,
  ): boolean {
    const room = this.activeRooms.get(roomId);
    const player = room?.players.find((item) => item.userId === userId);
    const playerState = room?.state.players[userId];

    if (!room || !player || !playerState) {
      return false;
    }

    const disconnectedAt = Date.now();
    player.disconnectedAt = disconnectedAt;
    player.reconnectDeadline = reconnectDeadline;
    playerState.disconnectedAt = disconnectedAt;
    playerState.reconnectDeadline = reconnectDeadline;
    playerState.lastUpdateAt = disconnectedAt;

    return true;
  }

  clearPlayerDisconnected(roomId: string, userId: number): boolean {
    const room = this.activeRooms.get(roomId);
    const player = room?.players.find((item) => item.userId === userId);
    const playerState = room?.state.players[userId];

    if (!room || !player || !playerState) {
      return false;
    }

    const wasDisconnected =
      !!player.disconnectedAt ||
      !!player.reconnectDeadline ||
      !!playerState.disconnectedAt ||
      !!playerState.reconnectDeadline;

    delete player.disconnectedAt;
    delete player.reconnectDeadline;
    delete playerState.disconnectedAt;
    delete playerState.reconnectDeadline;

    return wasDisconnected;
  }

  isRoomWaitingForReconnect(roomId: string): boolean {
    const room = this.activeRooms.get(roomId);

    if (!room || room.status !== 'playing') {
      return false;
    }

    return room.players.some((player) => !!player.disconnectedAt);
  }

  getDisconnectedPlayer(roomId: string): Player | undefined {
    const room = this.activeRooms.get(roomId);

    if (!room || room.status !== 'playing') {
      return undefined;
    }

    return room.players.find((player) => !!player.disconnectedAt);
  }

  isGameSocketParticipant(
    roomId: string,
    userId: number,
    gameSocketId: string,
  ): boolean {
    const room = this.activeRooms.get(roomId);

    return !!room?.players.some(
      (player) =>
        player.userId === userId && player.gameSocketId === gameSocketId,
    );
  }

  isRoomPlaying(roomId: string): boolean {
    return this.activeRooms.get(roomId)?.status === 'playing';
  }

  updatePlayerPosition(
    roomId: string,
    userId: number,
    position: PlayerPosition,
  ): PlayerGameState | null {
    const room = this.activeRooms.get(roomId);
    const playerState = room?.state.players[userId];

    if (!playerState) {
      return null;
    }

    playerState.position = {
      x: position.x,
      y: position.y,
      rotation: position.rotation,
    };
    playerState.lastUpdateAt = Date.now();

    return this.clonePlayerState(playerState);
  }

  updatePlayerResources(
    roomId: string,
    userId: number,
    resources: Partial<Pick<PlayerGameState, 'hp' | 'ammo' | 'reserveAmmo'>>,
  ): PlayerGameState | null {
    const room = this.activeRooms.get(roomId);
    const playerState = room?.state.players[userId];

    if (!playerState) {
      return null;
    }

    if (typeof resources.hp === 'number') {
      playerState.hp = this.clamp(resources.hp, 0, playerState.maxHp);
    }

    if (typeof resources.ammo === 'number') {
      playerState.ammo = this.clamp(resources.ammo, 0, playerState.maxAmmo);
    }

    if (typeof resources.reserveAmmo === 'number') {
      playerState.reserveAmmo = this.clamp(
        resources.reserveAmmo,
        0,
        playerState.maxReserveAmmo,
      );
    }

    playerState.lastUpdateAt = Date.now();

    return this.clonePlayerState(playerState);
  }

  consumePlayerAmmo(
    roomId: string,
    userId: number,
    amount = 1,
  ): PlayerGameState | null {
    const room = this.activeRooms.get(roomId);
    const playerState = room?.state.players[userId];

    if (!playerState || playerState.ammo < amount) {
      return null;
    }

    playerState.ammo -= amount;
    playerState.lastUpdateAt = Date.now();

    return this.clonePlayerState(playerState);
  }

  reloadPlayerAmmo(roomId: string, userId: number): PlayerGameState | null {
    const room = this.activeRooms.get(roomId);
    const playerState = room?.state.players[userId];

    if (!playerState) {
      return null;
    }

    const neededAmmo = playerState.maxAmmo - playerState.ammo;
    const loadedAmmo = Math.min(neededAmmo, playerState.reserveAmmo);

    if (loadedAmmo <= 0) {
      return this.clonePlayerState(playerState);
    }

    playerState.ammo += loadedAmmo;
    playerState.reserveAmmo -= loadedAmmo;
    playerState.lastUpdateAt = Date.now();

    return this.clonePlayerState(playerState);
  }

  damagePlayer(
    roomId: string,
    userId: number,
    damage: number,
  ): { playerState: PlayerGameState; opponentState: PlayerGameState | null } | null {
    const room = this.activeRooms.get(roomId);
    const playerState = room?.state.players[userId];

    if (!room || !playerState) {
      return null;
    }

    playerState.hp = this.clamp(playerState.hp - damage, 0, playerState.maxHp);
    playerState.lastUpdateAt = Date.now();

    const opponent = room.players.find((player) => player.userId !== userId);
    const opponentState = opponent
      ? this.clonePlayerState(room.state.players[opponent.userId])
      : null;

    const clonedPlayerState = this.clonePlayerState(playerState);

    if (!clonedPlayerState) {
      return null;
    }

    return {
      playerState: clonedPlayerState,
      opponentState,
    };
  }

  collectItem(
    roomId: string,
    userId: number,
    itemId: string,
  ): { item: GameItem; playerState: PlayerGameState; items: GameItem[] } | null {
    const room = this.activeRooms.get(roomId);
    const playerState = room?.state.players[userId];
    const item = room?.state.items[itemId];

    if (!room || !playerState || !item) {
      return null;
    }

    delete room.state.items[itemId];

    if (item.type === 'health') {
      playerState.hp = this.clamp(
        playerState.hp + this.HEALTH_PACK_AMOUNT,
        0,
        playerState.maxHp,
      );
    } else {
      playerState.reserveAmmo = this.clamp(
        playerState.reserveAmmo + this.AMMO_PACK_AMOUNT,
        0,
        playerState.maxReserveAmmo,
      );
    }

    playerState.lastUpdateAt = Date.now();
    this.ensureRoomItems(room);

    const clonedPlayerState = this.clonePlayerState(playerState);

    if (!clonedPlayerState) {
      return null;
    }

    return {
      item: { ...item },
      playerState: clonedPlayerState,
      items: this.cloneRoomItems(room),
    };
  }

  getRoomItems(roomId: string): GameItem[] {
    const room = this.activeRooms.get(roomId);

    if (!room) {
      return [];
    }

    return this.cloneRoomItems(room);
  }

  getPlayerState(roomId: string, userId: number): PlayerGameState | null {
    const room = this.activeRooms.get(roomId);
    const playerState = room?.state.players[userId];

    return this.clonePlayerState(playerState);
  }

  getOpponentState(roomId: string, userId: number): PlayerGameState | null {
    const room = this.activeRooms.get(roomId);
    const opponent = room?.players.find((player) => player.userId !== userId);

    if (!opponent) {
      return null;
    }

    return this.getPlayerState(roomId, opponent.userId);
  }

  getRoomState(roomId: string): GameRoomState | null {
    const room = this.activeRooms.get(roomId);

    if (!room) {
      return null;
    }

    const players: Record<number, PlayerGameState> = {};

    for (const [userId, playerState] of Object.entries(room.state.players)) {
      players[Number(userId)] = {
        ...playerState,
        position: { ...playerState.position },
      };
    }

    return {
      players,
      socketToUserId: { ...room.state.socketToUserId },
      items: Object.fromEntries(
        Object.entries(room.state.items).map(([itemId, item]) => [
          itemId,
          { ...item },
        ]),
      ),
      itemSpawnCursor: room.state.itemSpawnCursor,
    };
  }

  updateRoomStatus(roomId: string, status: GameRoom['status']): boolean {
    const room = this.activeRooms.get(roomId);
    if (room) {
      room.status = status;
      return true;
    }
    return false;
  }

  getOpponentInRoom(roomId: string, socketId: string): Player | undefined {
    const room = this.activeRooms.get(roomId);
    if (room) {
      return room.players.find(p => p.socketId !== socketId);
    }
    return undefined;
  }

  removeRoom(roomId: string): boolean {
    const deleted = this.activeRooms.delete(roomId);
    if (deleted) {
      this.logger.log(`Комната ${roomId} удалена`);
    }
    return deleted;
  }

  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private createMatchRoom(players: Player[]): GameRoom {
    const roomId = this.generateRoomId();
    const room: GameRoom = {
      id: roomId,
      players,
      createdAt: Date.now(),
      status: 'waiting',
      state: this.createRoomState(players),
    };

    this.activeRooms.set(roomId, room);

    return room;
  }

  private createRoomState(players: Player[]): GameRoomState {
    const state: GameRoomState = {
      players: Object.fromEntries(
        players.map((player, index) => [
          player.userId,
          this.createPlayerState(player, index),
        ]),
      ),
      socketToUserId: {},
      items: {},
      itemSpawnCursor: 0,
    };

    this.ensureRoomItems({ state });

    return state;
  }

  private createPlayerState(player: Player, spawnIndex: number): PlayerGameState {
    const spawn = this.DEFAULT_SPAWNS[spawnIndex] ?? this.DEFAULT_SPAWNS[0];

    return {
      userId: player.userId,
      nickname: player.nickname,
      title: player.title,
      lobbySocketId: player.socketId,
      gameSocketId: player.gameSocketId,
      spawnIndex,
      hp: this.PLAYER_MAX_HP,
      maxHp: this.PLAYER_MAX_HP,
      ammo: this.PLAYER_MAX_AMMO,
      maxAmmo: this.PLAYER_MAX_AMMO,
      reserveAmmo: this.PLAYER_MAX_RESERVE_AMMO,
      maxReserveAmmo: this.PLAYER_MAX_RESERVE_AMMO,
      position: { ...spawn },
      lastUpdateAt: Date.now(),
    };
  }

  private clonePlayerState(
    playerState: PlayerGameState | undefined | null,
  ): PlayerGameState | null {
    if (!playerState) {
      return null;
    }

    return {
      ...playerState,
      position: { ...playerState.position },
    };
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }

  private ensureRoomItems(room: Pick<GameRoom, 'state'>) {
    while (Object.keys(room.state.items).length < this.MAX_ITEMS_ON_MAP) {
      const spawn =
        this.ITEM_SPAWN_POINTS[
          room.state.itemSpawnCursor % this.ITEM_SPAWN_POINTS.length
        ];
      const id = `item_${Date.now()}_${room.state.itemSpawnCursor}`;

      room.state.items[id] = {
        id,
        type: spawn.type,
        x: spawn.x,
        y: spawn.y,
      };
      room.state.itemSpawnCursor += 1;
    }
  }

  private cloneRoomItems(room: GameRoom): GameItem[] {
    return Object.values(room.state.items).map((item) => ({ ...item }));
  }

  getWaitingCount(): number {
    return this.waitingPlayers.size;
  }

  getActiveRoomsCount(): number {
    return this.activeRooms.size;
  }
}
