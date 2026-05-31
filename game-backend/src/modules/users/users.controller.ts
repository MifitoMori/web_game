import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { EquipItemDto } from './dto/equip-item.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { Role } from '@prisma/client';
import { LoggerService } from '../../common/logger/logger.service';

@Controller(['users', ''])
export class UsersController {
  private readonly logger: LoggerService;

  constructor(private readonly usersService: UsersService, logger: LoggerService,) {
    this.logger = logger.child('UsersController');
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: { user: { userId: number; login: string; role: Role } }) {
    this.logger.debug(`Запрос данных текущего пользователя: ${req.user.login}`);
    return this.usersService.getSafeById(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(
    @Req() req: { user: { userId: number; login: string; role: Role } },
  ) {
    this.logger.debug(`Запрос профиля: ${req.user.login}`);
    return this.usersService.getProfileView(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/profile')
  getPublicProfile(
    @Req() req: { user: { userId: number; login: string; role: Role } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    this.logger.debug(`Пользователь ${req.user.login} запрашивает профиль ID: ${id}`);
    return this.usersService.getPublicProfileView(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile/settings')
  updateSettings(
    @Req() req: { user: { userId: number; login: string; role: Role } },
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.usersService.updateSettings(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/equip')
  equipItem(
    @Req() req: { user: { userId: number; login: string; role: Role } },
    @Body() dto: EquipItemDto,
  ) {
    return this.usersService.equipItem(req.user.userId, dto.inventoryItemId);
  }
}
