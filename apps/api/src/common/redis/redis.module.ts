import { Module } from '@nestjs/common';
import { RedisConnectionService } from './redis-connection.service';
import { RedisHealthService } from './redis-health.service';

@Module({
  providers: [RedisConnectionService, RedisHealthService],
  exports: [RedisConnectionService, RedisHealthService],
})
export class RedisModule {}
