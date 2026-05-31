export class NetworkService {
  private static instance: NetworkService;
  private serverIp: string | null = null;

  static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

    async getServerIp(): Promise<string> {
    // Подключаемся к тому же хосту, на котором открыта страница,
    // чтобы cookie с токеном совпадала с адресом сокета.
    this.serverIp = window.location.hostname || 'localhost';
    return this.serverIp;
  }

  getWebSocketUrl(): Promise<string> {
    return this.getServerIp().then(ip => `http://${ip}:3001/game`);
  }

  getGameUrl(): Promise<string> {
    return this.getServerIp().then(ip => `http://${ip}:8080`);
  }
}
