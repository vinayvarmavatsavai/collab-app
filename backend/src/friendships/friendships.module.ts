import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from './entities/friendship.entity';
import { FriendSuggestion } from './entities/friend-suggestion.entity';
import { Identity } from 'src/auth/entities/identity.entity';
import { UserProfile } from 'src/users/entities/user-profile.entity';
import { FriendshipsService } from './services/friendships.service';
import { FriendSuggestionsService } from './services/friend-suggestions.service';
import { FriendshipsController } from './controllers/friendships.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Friendship,
            FriendSuggestion,
            Identity,
            UserProfile,
        ]),
    ],
    controllers: [FriendshipsController],
    providers: [FriendshipsService, FriendSuggestionsService],
    exports: [FriendshipsService, FriendSuggestionsService],
})
export class FriendshipsModule { }
