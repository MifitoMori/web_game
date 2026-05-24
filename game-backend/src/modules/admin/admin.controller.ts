import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('catalog')
  getItems() {
    return this.adminService.findAllCatalogItems();
  }

  @Get('users')
  getUsers() {
    return this.adminService.findAllUsers();
  }

  @Patch('users/:id')
  updateUser(
    @Req() req: { user: { userId: number; role: Role } },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole({
      actorId: req.user.userId,
      actorRole: req.user.role,
      targetUserId: id,
      nextRole: dto.role,
    });
  }

  @Post('catalog')
  createCatalogItem(@Body() dto: CreateCatalogItemDto) {
    return this.adminService.createCatalogItem(dto);
  }

  @Patch('catalog/:id')
  updateCatalogItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCatalogItemDto,
  ) {
    return this.adminService.updateCatalogItem(id, dto);
  }

  @Delete('catalog/:id')
  deleteCatalogItem(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteCatalogItem(id);
  }
}
