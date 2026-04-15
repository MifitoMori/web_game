import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { Roles } from "src/common/roles.decorator";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "src/common/roles.guard";
import { Role } from "@prisma/client";
import { UpdateUserRoleDto } from "./dto/update-user-role.dto";
import { CreateCatalogItemDto } from "./dto/create-catalog-item.dto";
import { UpdateCatalogItemDto } from "./dto/update-catalog-item.dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}
    
    @Get('catalog')
    getItems() {
        return this.adminService.findAllCatalogItems()
    }

    @Get('users')
    getUsers(){
        return this.adminService.findAllUsers()
    }

    @Patch('users/:id')
    updateUser(
        @Req() req: { user: { userId: number } },
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateUserRoleDto,
    ){
        if (req.user.userId === id) {
            throw new BadRequestException('Нельзя изменить роль собственного аккаунта');
        }

        return this.adminService.updateUserRole(id, dto.role); 
    }
    
    @Post('catalog')
    createCatalogItem(
        @Body() dto: CreateCatalogItemDto
    ){
        return this.adminService.createCatalogItem(dto)
    }

    @Patch('catalog/:id')
    updateCatalogItem(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCatalogItemDto,
    ){
        return this.adminService.updateCatalogItem(id, dto)
    }

    @Delete('catalog/:id')
    deleteCatalogItem(
        @Param('id', ParseIntPipe) id: number,
    ){
        return this.adminService.deleteCatalogItem(id)
    }
}
