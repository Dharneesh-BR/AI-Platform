import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import type {
  DiscoveryQueue,
  DiscoveryQueueContext,
} from '../../application/ports/discovery-queue.port';
import type { DiscoveryJobEntity } from '../../domain/entities/discovery-job.entity';

@Injectable()
export class BullMqDiscoveryQueue implements DiscoveryQueue {
  private readonly queue: Queue;

  constructor(configService: ConfigService) {
    const redisUrl = new URL(configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379');
    this.queue = new Queue('discovery', {
      connection: {
        host: redisUrl.hostname,
        port: Number(redisUrl.port || 6379),
        password: redisUrl.password || undefined,
      },
    });
  }

  async enqueue(job: DiscoveryJobEntity, context?: DiscoveryQueueContext): Promise<void> {
    await this.queue.add(
      'company-discovery',
      {
        discoveryJobId: job.id,
        organizationId: job.organizationId,
        projectId: job.projectId,
        actorUserId: job.createdBy,
        companyName: context?.companyName,
        websiteUrl: context?.websiteUrl,
        industry: context?.industry,
        businessGoals: context?.businessGoals,
        primaryChallenges: context?.primaryChallenges,
        competitors: context?.competitors,
      },
      {
        jobId: job.id,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 30_000,
        },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    );
  }
}
