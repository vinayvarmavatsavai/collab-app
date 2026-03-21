import { IsEnum, IsNotEmpty } from 'class-validator';
import { FriendshipStatus } from '../entities/friendship.entity';

export class RespondFriendRequestDto {
    @IsEnum(FriendshipStatus)
    @IsNotEmpty()
    status: FriendshipStatus.ACCEPTED | FriendshipStatus.REJECTED;
}
