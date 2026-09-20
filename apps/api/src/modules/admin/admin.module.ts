import { Module } from '@nestjs/common';
import { QueueModule } from '../../common/queue/queue.module';
import { RedisModule } from '../../common/redis/redis.module';
import { AdminController } from './admin.controller';
import { AdminHealthService } from './admin-health.service';
import { AdminObservabilityService } from './admin-observability.service';

@Module({
  imports: [QueueModule, RedisModule],
  controllers: [AdminController],
  providers: [AdminHealthService, AdminObservabilityService],
})
export class AdminModule {}
