import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { FriendsService } from './friends.service';

type AuthRequest = {
  user: {
    userId: number;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  getFriends(@Req() req: AuthRequest) {
    return this.friendsService.getFriends(req.user.userId);
  }

  @Get('requests')
  getFriendRequests(@Req() req: AuthRequest) {
    return this.friendsService.getFriendRequests(req.user.userId);
  }

  @Get('search')
  searchUsers(@Req() req: AuthRequest, @Query('query') query = '') {
    return this.friendsService.searchUsers(req.user.userId, query);
  }

  @Post('requests')
  sendFriendRequest(
    @Req() req: AuthRequest,
    @Body() dto: SendFriendRequestDto,
  ) {
    return this.friendsService.sendFriendRequest(req.user.userId, dto.userId);
  }

  @Post('requests/:id/accept')
  acceptFriendRequest(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) requestId: number,
  ) {
    return this.friendsService.acceptFriendRequest(req.user.userId, requestId);
  }

  @Post('requests/:id/decline')
  declineFriendRequest(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) requestId: number,
  ) {
    return this.friendsService.declineFriendRequest(req.user.userId, requestId);
  }

  @Delete('requests/:id')
  cancelFriendRequest(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) requestId: number,
  ) {
    return this.friendsService.cancelFriendRequest(req.user.userId, requestId);
  }

  @Delete(':userId')
  removeFriend(
    @Req() req: AuthRequest,
    @Param('userId', ParseIntPipe) friendUserId: number,
  ) {
    return this.friendsService.removeFriend(req.user.userId, friendUserId);
  }
}
