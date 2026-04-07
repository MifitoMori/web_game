import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ShopService } from './shop.service';
import { PurchaseItemDto } from './dto/purchase-item.dto';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('catalog')
  getCatalog(@Req() req: { user: { userId: number } }) {
    return this.shopService.getCatalogForUser(req.user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('purchase')
  purchaseItem(
    @Req() req: { user: { userId: number } },
    @Body() dto: PurchaseItemDto,
  ) {
    return this.shopService.purchaseItem(req.user.userId, dto.slug);
  }
}
