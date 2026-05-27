import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { EquipItemDto } from './dto/equip-item.dto';
import { UnequipItemDto } from './dto/unequip-item.dto';
import { Role } from '@prisma/client';

@Controller(['users', ''])
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: { user: { userId: number; login: string; role: Role } }) {
    return this.usersService.getSafeById(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(
    @Req() req: { user: { userId: number; login: string; role: Role } },
  ) {
    return this.usersService.getProfileView(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/profile')
  getPublicProfile(
    @Req() req: { user: { userId: number; login: string; role: Role } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.getPublicProfileView(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/equip')
  equipItem(
    @Req() req: { user: { userId: number; login: string; role: Role } },
    @Body() dto: EquipItemDto,
  ) {
    return this.usersService.equipItem(req.user.userId, dto.inventoryItemId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/unequip')
  unequipItem(
    @Req() req: { user: { userId: number; login: string; role: Role } },
    @Body() dto: UnequipItemDto,
  ) {
    return this.usersService.unequipItem(req.user.userId, dto.type);
  }
}
