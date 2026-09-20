import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ConnectionOptions } from 'bullmq';

@Injectable()
export class RedisConnectionService {
  constructor(private readonly configService: ConfigService) {}

  get url(): string {
    return this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
  }

  getConnectionOptions(): ConnectionOptions {
    const redisUrl = new URL(this.url);

    return {
      host: redisUrl.hostname,
      port: Number(redisUrl.port || 6379),
      username: redisUrl.username || undefined,
      password: redisUrl.password || undefined,
      db: redisUrl.pathname && redisUrl.pathname !== '/' ? Number(redisUrl.pathname.slice(1)) : undefined,
    };
  }
}
