import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth() {
    const count = await this.prisma.healthcheck.count();

    return {
      status: 'ok',
      database: 'connected',
      recordsInHealthcheck: count,
      timestamp: new Date().toISOString(),
    };
  }
}