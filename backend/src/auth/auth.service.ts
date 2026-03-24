import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';

import { Identity, IdentityStatus } from './entities/identity.entity';
import { AuthSession } from './entities/auth-session.entity';
import { UsersService } from 'src/users/services/users/users.service';
import { CommunitiesService } from 'src/communities/communities.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,

    @InjectRepository(Identity)
    private readonly identityRepo: Repository<Identity>,

    @InjectRepository(AuthSession)
    private readonly sessionsRepo: Repository<AuthSession>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,

    @Inject('REDIS_CLIENT')
    private readonly redisClient: Redis,

    private readonly communitiesService: CommunitiesService,
  ) { }

  async signupUser(dto: {
  email: string;
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  phone: string;
  skills: string[];
  intent: any;
}) {
  const normalizedEmail = dto.email.trim().toLowerCase();
  const normalizedUsername = dto.username.trim().toLowerCase();

  const existing = await this.identityRepo.findOne({
    where: [{ email: normalizedEmail }, { username: normalizedUsername }],
  });

  if (existing) {
    throw new ConflictException('Identity already exists');
  }

  const identity = this.identityRepo.create({
    email: normalizedEmail,
    username: normalizedUsername,
    passwordHash: await bcrypt.hash(dto.password, 10),
    type: 'ADMIN',
    status: IdentityStatus.ACTIVE,
  });

  await this.identityRepo.save(identity);

  const profile = await this.usersService.createUserProfile(identity.id, {
    firstname: dto.firstname,
    lastname: dto.lastname,
    phone: dto.phone,
    skills: dto.skills,
    intent: dto.intent,
  });

  try {
    await this.communitiesService.handleNewUser(identity.email, profile.id);
  } catch (e) {
    console.error('Failed to handle new user community:', e);
  }

  return {
    id: identity.id,
    email: identity.email,
    type: identity.type,
  };
}


  async signin(email: string, password: string, ip?: string, ua?: string) {
    const identity = await this.identityRepo.findOne({
      where: { email },
      select: ['id', 'email', 'username', 'passwordHash', 'type', 'status'],
    });

    if (!identity || identity.status !== IdentityStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, identity.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const { refreshToken, sessionId } =
      await this.generateRefreshToken(identity.id, ip, ua);

    const accessToken = await this.generateAccessToken(identity);

    const profile = await this.usersService.getProfileByIdentity(identity.id);

    return {
      accessToken,
      refreshToken,
      sessionId,
      identity: {
        id: identity.id,
        email: identity.email,
        username: identity.username,
        type: identity.type,
        onboardingCompleted: profile?.onboardingCompleted || false,
        profileCompleteness: profile?.profileCompleteness || 0,
      },
    };
  }

  private async generateAccessToken(identity: Identity) {
    return this.jwtService.signAsync({
      sub: identity.id,
      type: identity.type,
    });
  }



  private async generateRefreshToken(
    identityId: string,
    ip?: string,
    ua?: string,
  ) {
    const sessionId = uuidv4();
    const days =
      this.configService.get<number>('jwt.refreshExpiresInDays') ?? 7;

    const refreshToken = await this.jwtService.signAsync(
      { sub: identityId, sessionId },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: `${days * 24}h`,
      },
    );

    const hash = await bcrypt.hash(refreshToken, 10);

    await this.redisClient.set(sessionId, hash, 'EX', days * 86400);

    await this.sessionsRepo.save({
      id: sessionId,
      identityId,
      refreshTokenHash: hash,
      expiresAt: new Date(Date.now() + days * 86400000),
      ip,
      userAgent: ua,
    });

    return { refreshToken, sessionId };
  }

  private async rotateRefreshToken(oldSessionId: string, userId: string) {
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    const refreshExpiresInDays =
      this.configService.get<number>('jwt.refreshExpiresInDays') ?? 7;

    if (!refreshSecret) {
      throw new Error('JWT refresh secret not configured');
    }

    // CRITICAL: Use database transaction with row-level lock
    // This prevents race condition where multiple requests try to rotate the same session
    const queryRunner = this.sessionsRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock the row to prevent concurrent updates
      const lockedSession = await queryRunner.manager
        .createQueryBuilder(AuthSession, 'session')
        .where('session.id = :id', { id: oldSessionId })
        .setLock('pessimistic_write')
        .getOne();

      if (!lockedSession) {
        throw new UnauthorizedException('Session not found');
      }

      if (lockedSession.revokedAt) {
        // Another request already rotated this session
        throw new UnauthorizedException('Session already rotated');
      }

      // Delete from Redis immediately
      await this.redisClient.del(oldSessionId);

      const newSessionId = uuidv4();

      const newRefreshToken = await this.jwtService.signAsync(
        { sub: userId, sessionId: newSessionId },
        {
          secret: refreshSecret,
          expiresIn: `${refreshExpiresInDays * 24}h`,
        },
      );

      const hashed = await bcrypt.hash(newRefreshToken, 10);

      await this.redisClient.set(
        newSessionId,
        hashed,
        'EX',
        60 * 60 * 24 * refreshExpiresInDays,
      );

      await queryRunner.manager.save(AuthSession, {
        id: newSessionId,
        identityId: userId,
        refreshTokenHash: hashed,
        expiresAt: new Date(
          Date.now() + refreshExpiresInDays * 24 * 60 * 60 * 1000,
        ),
      });

      await queryRunner.manager.update(
        AuthSession,
        { id: oldSessionId },
        {
          revokedAt: new Date(),
          replacedBy: newSessionId,
        },
      );

      await queryRunner.commitTransaction();

      return { refreshToken: newRefreshToken, sessionId: newSessionId };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async refresh(refreshToken: string) {
    const refreshExpiresInDays =
      this.configService.get<number>('jwt.refreshExpiresInDays') ?? 7;
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');

    if (!refreshSecret) {
      throw new Error('JWT refresh secret not configured');
    }

    let payload: { sub: string; sessionId: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshSecret,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // CRITICAL: Check DB first to prevent race condition
    // This ensures we detect if another request already revoked this session
    const session = await this.sessionsRepo.findOneBy({
      id: payload.sessionId,
    });

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (session.revokedAt) {
      console.warn(`⚠️ Token reuse detected for session ${payload.sessionId}`);
      await this.revokeAllUserSessions(session.identityId);
      throw new UnauthorizedException('Token reuse detected - all sessions revoked');
    }

    // Try Redis for performance, but DB is source of truth
    let storedHash = await this.redisClient.get(payload.sessionId);

    if (!storedHash) {
      storedHash = session.refreshTokenHash;
      // Restore to Redis
      await this.redisClient.set(
        payload.sessionId,
        storedHash,
        'EX',
        60 * 60 * 24 * refreshExpiresInDays,
      );
    }

    const isValid = await bcrypt.compare(refreshToken, storedHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const identity = await this.identityRepo.findOne({
      where: { id: payload.sub },
    });

    if (!identity) {
      throw new UnauthorizedException('User not found');
    }

    const { refreshToken: newRefreshToken, sessionId: newSessionId } =
      await this.rotateRefreshToken(payload.sessionId, identity.id);

    const accessToken = await this.generateAccessToken(identity);

    const profile = await this.usersService.getProfileByIdentity(identity.id);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      sessionId: newSessionId,
      identity: {
        id: identity.id,
        email: identity.email,
        username: identity.username,
        type: identity.type,
        onboardingCompleted: profile?.onboardingCompleted || false,
        profileCompleteness: profile?.profileCompleteness || 0,
      },
    };
  }

  private async revokeAllUserSessions(userId: string) {
    const sessions = await this.sessionsRepo.find({
      where: { identityId: userId, revokedAt: null as any },
    });

    await this.sessionsRepo.update(
      { identityId: userId, revokedAt: null as any },
      { revokedAt: new Date() },
    );

    const pipeline = this.redisClient.pipeline();
    for (const session of sessions) {
      pipeline.del(session.id);
    }
    await pipeline.exec();

    console.log(`🔒 Revoked ${sessions.length} sessions for user ${userId}`);
  }

  async getUserSessions(userId: string) {
    const sessions = await this.sessionsRepo.find({
      where: { identityId: userId, revokedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    return sessions.map((session) => ({
      id: session.id,
      ip: session.ip,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
    }));
  }

  async revokeSession(sessionId: string, userId: string) {
    const session = await this.sessionsRepo.findOneBy({ id: sessionId });

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (session.identityId !== userId) {
      throw new UnauthorizedException('Not authorized to revoke this session');
    }

    await this.redisClient.del(sessionId);
    await this.sessionsRepo.update(
      { id: sessionId },
      { revokedAt: new Date() },
    );
  }

  async logout(sessionId: string) {
    await this.redisClient.del(sessionId);
    await this.sessionsRepo.update(
      { id: sessionId },
      { revokedAt: new Date() },
    );
  }
}
