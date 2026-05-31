import { IsInt, Min } from 'class-validator';

export class SendFriendRequestDto {
  @IsInt()
  @Min(1)
  userId: number;
}
