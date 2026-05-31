class MultiplayerSocket {
    constructor() {
      this.socket = null;
      this.roomId = null;
      this.connected = false;
      this.userId = null;
      this.nickname = null;
    }
  
    connect(userId, nickname, serverIp = 'localhost') {
      return new Promise((resolve, reject) => {
        // Проверяем, что io доступен глобально (из CDN)
        if (typeof io === 'undefined') {
          reject(new Error('Socket.IO not loaded. Check CDN connection.'));
          return;
        }

        let settled = false;

        const cleanup = () => {
          this.socket?.off('authSuccess', handleAuthSuccess);
          this.socket?.off('authError', handleAuthError);
          this.socket?.off('connect_error', handleConnectError);
        };

        const handleAuthSuccess = (data) => {
          if (settled) return;

          settled = true;
          this.connected = true;
          this.userId = data?.userId ?? userId;
          this.nickname = data?.nickname ?? nickname;
          cleanup();
          resolve();
        };

        const handleAuthError = (error) => {
          if (settled) return;

          settled = true;
          cleanup();
          reject(new Error(error?.message || 'WebSocket auth failed'));
        };

        const handleConnectError = (error) => {
          if (settled) return;

          settled = true;
          cleanup();
          reject(error);
        };
        
        this.socket = io(`http://${serverIp}:3001/game`, {
          transports: ['websocket'],
          reconnection: false,
          withCredentials: true,
        });
  
        this.socket.on('connect', () => {
          console.log('WebSocket connected:', this.socket.id);
        });

        this.socket.on('authSuccess', (data) => {
          handleAuthSuccess(data);
        });

        this.socket.on('authError', (error) => {
          console.error('WebSocket auth error:', error);
          handleAuthError(error);
        });
  
        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          handleConnectError(error);
        });
      });
    }
  
    findMatch() {
      if (!this.socket) return;
      this.socket.emit('findMatch', {});
    }

    joinGameRoom(roomId) {
      return new Promise((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('WebSocket is not connected'));
          return;
        }

        const handleJoined = (data) => {
          this.roomId = data.roomId;
          cleanup();
          resolve(data);
        };

        const handleError = (error) => {
          cleanup();
          reject(new Error(error?.message || 'Failed to join game room'));
        };

        const cleanup = () => {
          this.socket.off('gameRoomJoined', handleJoined);
          this.socket.off('gameRoomJoinError', handleError);
        };

        this.socket.on('gameRoomJoined', handleJoined);
        this.socket.on('gameRoomJoinError', handleError);
        this.socket.emit('joinGameRoom', { roomId });
      });
    }
  
    cancelSearch() {
      if (!this.socket) return;
      this.socket.emit('cancelSearch');
    }
  
    onWaitingForPlayer(callback) {
      this.socket?.on('waitingForPlayer', callback);
    }
  
    onMatchFound(callback) {
      this.socket?.on('matchFound', (data) => {
        this.roomId = data.roomId;
        callback(data);
      });
    }
  
    onSearchCancelled(callback) {
      this.socket?.on('searchCancelled', callback);
    }

    onMatchmakingRejected(callback) {
      this.socket?.on('matchmakingRejected', callback);
    }
  
    updatePlayerPosition(data) {
      if (!this.socket || !this.roomId) return;
      this.socket.emit('playerUpdate', {
        roomId: this.roomId,
        ...data,
      });
    }
  
    shoot(bulletData) {
      if (!this.socket || !this.roomId) return;
      this.socket.emit('playerShoot', {
        roomId: this.roomId,
        bullet: bulletData,
      });
    }

    reload() {
      if (!this.socket || !this.roomId) return;
      this.socket.emit('playerReload', {
        roomId: this.roomId,
      });
    }

    collectItem(itemId) {
      if (!this.socket || !this.roomId) return;
      this.socket.emit('collectItem', {
        roomId: this.roomId,
        itemId,
      });
    }
  
    onOpponentUpdate(callback) {
      this.socket?.on('opponentUpdate', callback);
    }

    onPlayerShootConfirmed(callback) {
      this.socket?.on('playerShootConfirmed', callback);
    }

    onPlayerShootRejected(callback) {
      this.socket?.on('playerShootRejected', callback);
    }

    onPlayerReloadConfirmed(callback) {
      this.socket?.on('playerReloadConfirmed', callback);
    }

    onPlayerReloadRejected(callback) {
      this.socket?.on('playerReloadRejected', callback);
    }

    onItemsSync(callback) {
      this.socket?.on('itemsSync', callback);
    }

    onCollectItemRejected(callback) {
      this.socket?.on('collectItemRejected', callback);
    }

    onItemCollected(callback) {
      this.socket?.on('itemCollected', callback);
    }
  
    onOpponentShot(callback) {
      this.socket?.on('opponentShot', callback);
    }
  
    onOpponentHit(callback) {
      this.socket?.on('opponentHit', callback);
    }

    onPlayerHitConfirmed(callback) {
      this.socket?.on('playerHitConfirmed', callback);
    }

    onPlayerHitRejected(callback) {
      this.socket?.on('playerHitRejected', callback);
    }
  
    onOpponentLeft(callback) {
      this.socket?.on('opponentLeft', callback);
    }

    onOpponentDisconnected(callback) {
      this.socket?.on('opponentDisconnected', callback);
    }

    onOpponentReconnected(callback) {
      this.socket?.on('opponentReconnected', callback);
    }

    onOpponentJoinedGameRoom(callback) {
      this.socket?.on('opponentJoinedGameRoom', callback);
    }

    onGameStart(callback) {
      this.socket?.on('gameStart', callback);
    }

    onGameNotStarted(callback) {
      this.socket?.on('gameNotStarted', callback);
    }
  
    onGameEnd(callback) {
      this.socket?.on('gameEnd', callback);
    }
  
    leaveRoom() {
      if (!this.socket || !this.roomId) return;
      this.socket.emit('leaveRoom', { roomId: this.roomId });
      this.roomId = null;
    }
  
    disconnect() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
        this.connected = false;
        this.roomId = null;
      }
    }
  }
  
  export const multiplayerSocket = new MultiplayerSocket();
