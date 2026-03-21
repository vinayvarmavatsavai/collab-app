import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
    private client: Redis;

    constructor(private config: ConfigService) {
        this.client = new Redis({
            host: this.config.get<string>('REDIS_HOST') || 'localhost',
            port: parseInt(this.config.get<string>('REDIS_PORT') || '6379'),
        });
    }

    getClient() {
        return this.client;
    }
}