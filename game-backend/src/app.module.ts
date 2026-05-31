import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ShopModule } from './modules/shop/shop.module';
import { AdminModule } from './modules/admin/admin.module';
import { GameModule } from './modules/game/game.module';
import { LoggerModule } from './common/logger/logger.module';
import { NetworkModule } from './modules/network/network.module';
import { FriendsModule } from './modules/friends/friends.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    HealthModule,
    LoggerModule,
    AuthModule,
    UsersModule,
    ShopModule,
    AdminModule,
    FriendsModule,
    NetworkModule,
    GameModule
  ],
})
export class AppModule {}
