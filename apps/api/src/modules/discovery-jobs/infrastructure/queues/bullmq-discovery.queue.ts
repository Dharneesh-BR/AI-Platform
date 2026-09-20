import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../../../common/queue/queue.constants';
import { QueueInfrastructureService } from '../../../../common/queue/queue-infrastructure.service';
import type { DiscoveryJobPayload } from '../../application/ports/discovery-job.payload';
import type {
  DiscoveryQueue,
  DiscoveryQueueContext,
} from '../../application/ports/discovery-queue.port';
import type { DiscoveryJobEntity } from '../../domain/entities/discovery-job.entity';

@Injectable()
export class BullMqDiscoveryQueue implements DiscoveryQueue {
  private readonly logger = new Logger(BullMqDiscoveryQueue.name);
  private readonly queue: Queue<DiscoveryJobPayload>;

  constructor(private readonly queueInfrastructureService: QueueInfrastructureService) {
    this.queue = this.queueInfrastructureService.getQueue<DiscoveryJobPayload>(QUEUE_NAMES.discovery);
  }

  async enqueue(job: DiscoveryJobEntity, context?: DiscoveryQueueContext): Promise<void> {
    this.logger.log(`Enqueue discovery job queue=${QUEUE_NAMES.discovery} jobId=${job.id} projectId=${job.projectId}`);

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
      this.queueInfrastructureService.getJobOptions(job.id),
    );
  }

}
