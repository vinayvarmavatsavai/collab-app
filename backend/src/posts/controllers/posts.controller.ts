import {
    Controller,
    Get,
    Post as HttpPost,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { PostsService } from '../services/posts.service';
import { FeedService } from '../services/feed.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { FeedQueryDto } from '../dto/feed-query.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('posts')
export class PostsController {
    constructor(
        private readonly postsService: PostsService,
        private readonly feedService: FeedService,
    ) { }

    // ============================================
    // Post CRUD Operations
    // ============================================
    @UseGuards(JwtAuthGuard)
    @HttpPost()
    async createPost(@Request() req, @Body() dto: CreatePostDto) {
        return this.postsService.createPost(req.user.sub, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async getPost(@Param('id') id: string) {
        return this.postsService.getPostById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    async updatePost(
        @Param('id') id: string,
        @Request() req,
        @Body() dto: UpdatePostDto,
    ) {
        return this.postsService.updatePost(id, req.user.sub, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async deletePost(@Param('id') id: string, @Request() req) {
        await this.postsService.deletePost(id, req.user.sub);
        return { message: 'Post deleted successfully' };
    }

    // ============================================
    // Feed Endpoints
    // ============================================

    @UseGuards(JwtAuthGuard)
    @Get('feed/home')
    async getHomeFeed(@Request() req, @Query() query: FeedQueryDto) {
        return this.feedService.getHomeFeed(
            req.user.sub,
            query.cursor,
            query.limit,
        );
    }

    @Get('feed/public')
    async getPublicFeed(@Query() query: FeedQueryDto) {
        return this.feedService.getPublicFeed(
            query.cursor,
            query.limit,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get('feed/user/:userId')
    async getUserFeed(
        @Param('userId') userId: string,
        @Request() req,
        @Query() query: FeedQueryDto,
    ) {
        return this.feedService.getUserFeed(
            userId,
            req.user.sub,
            query.cursor,
            query.limit,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get('feed/friends')
    async getFriendsFeed(@Request() req, @Query() query: FeedQueryDto) {
        return this.feedService.getFriendsFeed(
            req.user.sub,
            query.cursor,
            query.limit,
        );
    }
}
