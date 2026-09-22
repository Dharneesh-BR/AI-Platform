import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ConnectionOptions } from 'bullmq';

@Injectable()
export class RedisConnectionService {
  constructor(private readonly configService: ConfigService) {}

  get url(): string {
    const redisUrl = this.configService.get<string>('REDIS_URL')?.trim();

    if (redisUrl) {
      return redisUrl;
    }

    const host = this.configService.get<string>('REDISHOST')?.trim();
    const port = this.configService.get<string>('REDISPORT')?.trim() || '6379';
    const username = this.configService.get<string>('REDISUSER')?.trim();
    const password =
      this.configService.get<string>('REDISPASSWORD')?.trim() ||
      this.configService.get<string>('REDIS_PASSWORD')?.trim();

    if (host) {
      const auth =
        username || password
          ? `${encodeURIComponent(username ?? 'default')}:${encodeURIComponent(password ?? '')}@`
          : '';
      return `redis://${auth}${host}:${port}`;
    }

    return 'redis://localhost:6379';
  }

  getConnectionOptions(): ConnectionOptions {
    const redisUrl = new URL(this.url);

    return {
      host: redisUrl.hostname,
      port: Number(redisUrl.port || 6379),
      username: redisUrl.username ? decodeURIComponent(redisUrl.username) : undefined,
      password: redisUrl.password ? decodeURIComponent(redisUrl.password) : undefined,
      db: redisUrl.pathname && redisUrl.pathname !== '/' ? Number(redisUrl.pathname.slice(1)) : undefined,
      tls: redisUrl.protocol === 'rediss:' ? {} : undefined,
      maxRetriesPerRequest: null,
    };
  }
}
