import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisConnectionService } from './redis-connection.service';

export interface RedisHealthResult {
  status: 'healthy' | 'degraded' | 'unavailable';
  detail: string;
}

@Injectable()
export class RedisHealthService {
  constructor(private readonly redisConnectionService: RedisConnectionService) {}

  async check(): Promise<RedisHealthResult> {
    const client = new Redis(this.redisConnectionService.url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      connectTimeout: 2_000,
    });

    try {
      const response = await client.ping();
      return response === 'PONG'
        ? { status: 'healthy', detail: 'Redis ping succeeded.' }
        : { status: 'degraded', detail: 'Redis responded unexpectedly.' };
    } catch {
      return { status: 'unavailable', detail: 'Redis connection failed.' };
    } finally {
      client.disconnect();
    }
  }
}
