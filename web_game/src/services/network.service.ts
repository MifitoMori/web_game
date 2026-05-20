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
    // Уже есть сохраненный IP
    if (this.serverIp !== null) {
      return this.serverIp;
    }

    try {
      const response = await fetch('/api/network/ip');
      const data = await response.json();
      const detectedIp = data.ip as string; 
      this.serverIp = detectedIp;
      console.log('Server IP detected:', this.serverIp);
      return detectedIp; 
    } catch (error) {
      console.warn('Failed to detect server IP, using localhost');
      return 'localhost';
    }
  }

  getWebSocketUrl(): Promise<string> {
    return this.getServerIp().then(ip => `http://${ip}:3001/game`);
  }

  getGameUrl(): Promise<string> {
    return this.getServerIp().then(ip => `http://${ip}:8080`);
  }
}