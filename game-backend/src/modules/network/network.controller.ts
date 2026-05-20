import { Controller, Get } from '@nestjs/common';
import * as os from 'os';

@Controller('network')
export class NetworkController {
  @Get('ip')
  getLocalIp() {
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        // Пропускаем internal (localhost) и IPv6
        if (!iface.internal && iface.family === 'IPv4') {
          return { ip: iface.address };
        }
      }
    }
    
    return { ip: 'localhost' };
  }
}