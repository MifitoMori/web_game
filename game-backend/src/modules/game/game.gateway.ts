import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { GameService } from './game.service';
  import { Logger } from '@nestjs/common';
  
  interface ClientWithUser extends Socket {
    userId?: number;
    nickname?: string;
  }
  
  @WebSocketGateway({
    cors: {
      origin: '*', // Для разработки
      credentials: true,
    },
    namespace: 'game',
  })
  export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    private readonly logger = new Logger(GameGateway.name);
  
    constructor(private readonly gameService: GameService) {}
  
    handleConnection(client: ClientWithUser) {
      this.logger.log(`Клиент подключился: ${client.id}`);
    }
  
    handleDisconnect(client: ClientWithUser) {
      this.logger.log(`Клиент отключился: ${client.id}`);
      
      // Удаляем из очереди ожидания
      this.gameService.removeFromWaiting(client.id);
      
      // TODO: Обработка отключения во время игры
    }
  
    @SubscribeMessage('findMatch')
    handleFindMatch(
      @ConnectedSocket() client: ClientWithUser,
      @MessageBody() data: { userId: number; nickname: string },
    ) {
      this.logger.log(`Игрок ${data.nickname} ищет матч`);
      
      client.userId = data.userId;
      client.nickname = data.nickname;
      
      const player = {
        socketId: client.id,
        userId: data.userId,
        nickname: data.nickname,
        joinedAt: Date.now(),
      };
      
      // Пытаемся найти соперника
      const match = this.gameService.findMatch(player);
      
      if (match.found) {
        // Соперник найден!
        client.join(match.roomId);
        this.logger.log(`Игрок ${data.nickname} присоединился к комнате ${match.roomId}`);
        
        // Уведомляем текущего игрока
        client.emit('matchFound', {
          roomId: match.roomId,
          opponent: match.opponent,
        });
        
        // Уведомляем оппонента (через комнату)
        this.server.to(match.opponent.socketId).emit('matchFound', {
          roomId: match.roomId,
          opponent: {
            socketId: client.id,
            userId: data.userId,
            nickname: data.nickname,
          },
        });
        
        // Обновляем статус комнаты
        this.gameService.updateRoomStatus(match.roomId, 'playing');
      } else {
        // Нет соперника - добавляем в очередь
        const { timeout } = this.gameService.addToWaiting(player);
        client.emit('waitingForPlayer', { timeout });
      }
    }
  
    @SubscribeMessage('cancelSearch')
    handleCancelSearch(@ConnectedSocket() client: ClientWithUser) {
      const removed = this.gameService.removeFromWaiting(client.id);
      if (removed) {
        client.emit('searchCancelled');
        this.logger.log(`Игрок ${client.nickname} отменил поиск`);
      }
    }
  
    @SubscribeMessage('playerUpdate')
    handlePlayerUpdate(
      @ConnectedSocket() client: ClientWithUser,
      @MessageBody() data: { roomId: string; x: number; y: number; rotation: number; hp: number; ammo: number },
    ) {
      // Передаем обновление другому игроку в комнате
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
      @MessageBody() data: { roomId: string; bullet: { x: number; y: number; angle: number; id: string } },
    ) {
      client.to(data.roomId).emit('opponentShot', data.bullet);
    }
  
    @SubscribeMessage('playerHit')
    handlePlayerHit(
      @ConnectedSocket() client: ClientWithUser,
      @MessageBody() data: { roomId: string; damage: number; newHp: number; hitX: number; hitY: number },
    ) {
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
      this.server.to(data.roomId).emit('gameEnd', { winnerId: data.winnerId });
      this.gameService.removeRoom(data.roomId);
    }
  
    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(
      @ConnectedSocket() client: ClientWithUser,
      @MessageBody() data: { roomId: string },
    ) {
      client.leave(data.roomId);
      client.to(data.roomId).emit('opponentLeft');
      this.gameService.removeRoom(data.roomId);
    }
  }