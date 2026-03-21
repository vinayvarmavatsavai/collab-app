import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PostsService } from './services/posts.service';
import { FeedService } from './services/feed.service';
import { PostsController } from './controllers/posts.controller';
import { FriendshipsModule } from '../friendships/friendships.module';
import { UsersModule } from '../users/user.module';
import { MatchingModule } from '../matching/matching.module';
import { forwardRef } from '@nestjs/common';

@Module({
    imports: [
        TypeOrmModule.forFeature([Post]),
        FriendshipsModule, // For cross-module service access
        UsersModule, // For cross-module service access
        forwardRef(() => MatchingModule),
    ],
    controllers: [PostsController],
    providers: [PostsService, FeedService],
    exports: [PostsService, FeedService],
})
export class PostsModule { }
