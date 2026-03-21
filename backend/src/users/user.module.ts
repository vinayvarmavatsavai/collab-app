import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersController } from './controllers/users/users.controller';
import { UserSkillController } from './controllers/user-skill.controller';
import { UsersService } from './services/users/users.service';
import { UserSkillService } from './services/user-skill.service';
import { UserProfile } from './entities/user-profile.entity';
import { Identity } from 'src/auth/entities/identity.entity';
import { UserSkill } from '../matching/entities/user-skill.entity';
import { UserRole } from '../matching/entities/user-role.entity';
import { UserDomain } from '../matching/entities/user-domain.entity';
import { MatchingModule } from 'src/matching/matching.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([UserProfile, Identity, UserSkill, UserRole, UserDomain]),
        ConfigModule,
        forwardRef(() => MatchingModule)
    ],
    providers: [UsersService, UserSkillService],
    controllers: [UsersController, UserSkillController],
    exports: [UsersService, UserSkillService],
})
export class UsersModule { }

