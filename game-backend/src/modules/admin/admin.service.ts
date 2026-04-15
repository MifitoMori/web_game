import {   
    BadRequestException,
    Injectable,
    NotFoundException, } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Role } from "@prisma/client";
import { CreateCatalogItemDto } from "./dto/create-catalog-item.dto";
import { UpdateCatalogItemDto } from "./dto/update-catalog-item.dto";

@Injectable()
export class AdminService{
  constructor(private readonly prisma: PrismaService) {}

    private safeUserSelect = {
    id: true,
    email: true,
    login: true,
    firstName: true,
    secondName: true,
    gender: true,
    birthDate: true,
    avatarUrl: true,
    role: true,
    createdAt: true,
    updatedAt: true,
    profile: {
      select: {
        id: true,
        totalGames: true,
        wins: true,
        losses: true,
        draws: true,
        maxStreak: true,
        rating: true,
        credits: true,
        gems: true,
        experience: true,
        level: true,
      },
    },
  } as const;

  async findAllUsers(){
    const gameUsers = await this.prisma.user.findMany({
        orderBy: { id: 'asc' },
        select: this.safeUserSelect,
    });
    return gameUsers.map((user) => {
        return {
            id: user.id,
            firstName: user.firstName,
            secondName: user.secondName,
            login: user.login,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
        };
    });
  }

  async updateUserRole(userId: number, role: Role){
    const gameUser = await this.prisma.user.findUnique({
        where: {id: userId},
        select: { role: true }
    });
    if (!gameUser){
        throw new NotFoundException('Пользователь не найден');
    }
    const updatedUser = await this.prisma.user.update({
        where: {id: userId },
        data: {role}
    });
    return updatedUser
  }

  async findAllCatalogItems(){
    const catalogItems = await this.prisma.catalogItem.findMany({
        orderBy: { id: 'asc' },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          rarity: true,
          type: true,
          price: true,
          currency: true
        } 
    });
    return catalogItems
  }

  async createCatalogItem(dto: CreateCatalogItemDto){
    const newCatalogItem = await this.prisma.catalogItem.create({
      data: dto
    });
    return newCatalogItem
  }

  async updateCatalogItem(id: number, dto: UpdateCatalogItemDto){
    const updatedItem = await this.prisma.catalogItem.findUnique({
      where: {id}
    });
    if (!updatedItem){
      throw new NotFoundException('Предмет не найден');
    }
    const updatedCatalogItem = await this.prisma.catalogItem.update({
      where: {id},
      data: dto
    });
    return updatedCatalogItem
  }
    
  async deleteCatalogItem(id: number){
    const deletedItem = await this.prisma.catalogItem.findUnique({
      where: {id}
    });
    if (!deletedItem){
      throw new NotFoundException('Предмет не найден');
    }
    const deletedCatalogItem = await this.prisma.catalogItem.delete({
      where: {id}
    });
    return deletedCatalogItem
  }
}
