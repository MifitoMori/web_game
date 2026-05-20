import { Injectable, Logger } from '@nestjs/common';

export interface Player {
  socketId: string;
  userId: number;
  nickname: string;
  joinedAt: number;
}

export interface GameRoom {
  id: string;
  players: Player[];
  createdAt: number;
  status: 'waiting' | 'playing' | 'ended';
}

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  
  private waitingPlayers: Map<string, Player> = new Map();
  private activeRooms: Map<string, GameRoom> = new Map();
  
  private readonly SEARCH_TIMEOUT = 30000; // 30 секунд
  private readonly ROOM_INACTIVE_TIMEOUT = 5000; // 5 секунд

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

  findMatch(player: Player): { found: true; roomId: string; opponent: Player } | { found: false } {
    // Ищем ожидающего игрока (не самого себя)
    for (const [socketId, waitingPlayer] of this.waitingPlayers.entries()) {
      if (socketId !== player.socketId) {
        // Удаляем оппонента из очереди
        this.waitingPlayers.delete(socketId);
        
        // Создаем комнату
        const roomId = this.generateRoomId();
        const room: GameRoom = {
          id: roomId,
          players: [waitingPlayer, player],
          createdAt: Date.now(),
          status: 'waiting',
        };
        
        this.activeRooms.set(roomId, room);
        this.logger.log(`Создана комната ${roomId} для игроков ${waitingPlayer.nickname} и ${player.nickname}`);
        
        return { found: true, roomId, opponent: waitingPlayer };
      }
    }
    
    return { found: false };
  }

  removeFromWaiting(socketId: string): boolean {
    return this.waitingPlayers.delete(socketId);
  }

  getRoom(roomId: string): GameRoom | undefined {
    return this.activeRooms.get(roomId);
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

  getWaitingCount(): number {
    return this.waitingPlayers.size;
  }

  getActiveRoomsCount(): number {
    return this.activeRooms.size;
  }
}