import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import jwtConfig from './config/jwt.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import cloudinaryConfig from './config/cloudinary.config';
import appConfig from './config/app.config';
import matchingConfig from './config/matching.config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { FriendshipsModule } from './friendships/friendships.module';
import { PostsModule } from './posts/posts.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { MatchingModule } from './matching/matching.module';
import { BullConfigModule } from './bull/bull.module';
import { CommunitiesModule } from './communities/communities.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        jwtConfig,
        databaseConfig,
        redisConfig,
        cloudinaryConfig,
        appConfig,
        matchingConfig,
      ],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        return {
          type: dbConfig.type,
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.name,
          entities: [__dirname + '/typeorm/entities/*{.ts,.js}'],

          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),

    BullConfigModule,
    AuthModule,
    UsersModule,
    RedisModule,
    FriendshipsModule,
    PostsModule,
    OnboardingModule,
    OnboardingModule,
    MatchingModule,
    CommunitiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule { }
