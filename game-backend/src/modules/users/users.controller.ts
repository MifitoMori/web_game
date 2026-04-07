import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { EquipItemDto } from './dto/equip-item.dto';
import { UnequipItemDto } from './dto/unequip-item.dto';
import { Role } from '@prisma/client';

@Controller(['users', ''])
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: { user: { userId: number; login: string; role: Role } }) {
    return this.usersService.getSafeById(req.user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(
    @Req() req: { user: { userId: number; login: string; role: Role } },
  ) {
    return this.usersService.getProfileView(req.user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('profile/equip')
  equipItem(
    @Req() req: { user: { userId: number; login: string; role: Role } },
    @Body() dto: EquipItemDto,
  ) {
    return this.usersService.equipItem(req.user.userId, dto.inventoryItemId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('profile/unequip')
  unequipItem(
    @Req() req: { user: { userId: number; login: string; role: Role } },
    @Body() dto: UnequipItemDto,
  ) {
    return this.usersService.unequipItem(req.user.userId, dto.type);
  }
}
