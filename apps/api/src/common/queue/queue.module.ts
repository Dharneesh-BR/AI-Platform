import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { QueueInfrastructureService } from './queue-infrastructure.service';

@Module({
  imports: [RedisModule],
  providers: [QueueInfrastructureService],
  exports: [QueueInfrastructureService],
})
export class QueueModule {}
