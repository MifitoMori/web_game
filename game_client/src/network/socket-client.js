class MultiplayerSocket {
    constructor() {
      this.socket = null;
      this.roomId = null;
      this.connected = false;
      this.userId = null;
      this.nickname = null;
    }
  
    connect(userId, nickname) {
      return new Promise((resolve, reject) => {
        // Проверяем, что io доступен глобально (из CDN)
        if (typeof io === 'undefined') {
          reject(new Error('Socket.IO not loaded. Check CDN connection.'));
          return;
        }
        
        this.socket = io('http://localhost:3001/game', {
          transports: ['websocket'],
          reconnection: false,
          withCredentials: true,
        });
  
        this.socket.on('connect', () => {
          console.log('WebSocket connected:', this.socket.id);
          this.connected = true;
          this.userId = userId;
          this.nickname = nickname;
          resolve();
        });

        this.socket.on('authSuccess', (data) => {
          this.userId = data.userId;
          this.nickname = data.nickname;
        });

        this.socket.on('authError', (error) => {
          console.error('WebSocket auth error:', error);
          reject(new Error(error?.message || 'WebSocket auth failed'));
        });
  
        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          reject(error);
        });
      });
    }
  
    findMatch() {
      if (!this.socket) return;
      this.socket.emit('findMatch', {});
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
  
    onOpponentUpdate(callback) {
      this.socket?.on('opponentUpdate', callback);
    }
  
    onOpponentShot(callback) {
      this.socket?.on('opponentShot', callback);
    }
  
    onOpponentHit(callback) {
      this.socket?.on('opponentHit', callback);
    }
  
    onOpponentLeft(callback) {
      this.socket?.on('opponentLeft', callback);
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
