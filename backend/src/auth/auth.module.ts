import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
import { RefreshTokenStrategy } from 'src/auth/strategies/refresh.strategy';
import jwtConfig from 'src/config/jwt.config';
import { AuthSession } from './entities/auth-session.entity';
import { UsersModule } from 'src/users/user.module';
import { Identity } from './entities/identity.entity';
import { RedisModule } from 'src/redis/redis.module';
import { CommunitiesModule } from 'src/communities/communities.module';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    TypeOrmModule.forFeature([AuthSession, Identity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.accessSecret'),
        signOptions: {
          expiresIn: config.get<number>('jwt.accessExpiresIn'),
        },
      }),
    }),
    RedisModule,
    UsersModule,
    CommunitiesModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshTokenStrategy],
})
export class AuthModule { }

