import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import * as os from 'os';

const LOCALHOST_ADDRESSES = new Set(['localhost', '127.0.0.1', '::1', '::ffff:127.0.0.1']);

@Controller('network')
export class NetworkController {
  @Get('ip')
  getLocalIp(@Req() req: Request) {
    const requestHost = req.hostname;

    if (LOCALHOST_ADDRESSES.has(requestHost)) {
      return { ip: 'localhost' };
    }

    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (!iface.internal && iface.family === 'IPv4') {
          return { ip: iface.address };
        }
      }
    }

    return { ip: 'localhost' };
  }
}