import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { OnboardingStatus } from '../enums/onboarding-status.enum';


export interface ConversationMessage {
    role: 'assistant' | 'user';
    content: string;
    timestamp: Date;
}

export interface Profile {
    primaryRole?: string;
    roles: string[];
    domains: string[];
    skills: string[];
    experience: string[];
    interests: string[];
    availability: string | null;
}

@Entity('onboarding_sessions')
export class OnboardingSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column('uuid')
    identityId: string;

    @Column({ type: 'enum', enum: OnboardingStatus })
    status: OnboardingStatus;

    @Column('jsonb', { default: [] })
    conversationHistory: ConversationMessage[];

    @Column('jsonb', {
        default: {
            domains: [],
            skills: [],
            experience: [],
            interests: [],
            availability: null,
        }
    })
    profile: Profile;



    @Column('jsonb', { default: {} })
    selectedTags: Record<string, string[]>;

    @Column({ default: 0 })
    step: number;

    @Column({ nullable: true })
    currentQuestion: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    completedAt: Date;
}