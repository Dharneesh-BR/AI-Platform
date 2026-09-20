import { Module } from '@nestjs/common';
import { QueueModule } from '../../common/queue/queue.module';
import { DISCOVERY_EXECUTION_REPOSITORY } from './application/ports/discovery-execution.repository';
import { DISCOVERY_JOB_REPOSITORY } from './application/ports/discovery-job.repository';
import { DISCOVERY_QUEUE } from './application/ports/discovery-queue.port';
import { GetDiscoveryStatusUseCase } from './application/use-cases/get-discovery-status.use-case';
import { RetryDiscoveryUseCase } from './application/use-cases/retry-discovery.use-case';
import { PrismaDiscoveryJobRepository } from './infrastructure/prisma/prisma-discovery-job.repository';
import { PrismaDiscoveryExecutionRepository } from './infrastructure/prisma/prisma-discovery-execution.repository';
import { BullMqDiscoveryQueue } from './infrastructure/queues/bullmq-discovery.queue';
import { DiscoveryJobsController } from './presentation/controllers/discovery-jobs.controller';

@Module({
  imports: [QueueModule],
  controllers: [DiscoveryJobsController],
  providers: [
    GetDiscoveryStatusUseCase,
    RetryDiscoveryUseCase,
    {
      provide: DISCOVERY_JOB_REPOSITORY,
      useClass: PrismaDiscoveryJobRepository,
    },
    {
      provide: DISCOVERY_EXECUTION_REPOSITORY,
      useClass: PrismaDiscoveryExecutionRepository,
    },
    {
      provide: DISCOVERY_QUEUE,
      useClass: BullMqDiscoveryQueue,
    },
  ],
  exports: [DISCOVERY_EXECUTION_REPOSITORY, DISCOVERY_JOB_REPOSITORY, DISCOVERY_QUEUE],
})
export class DiscoveryJobsModule {}
