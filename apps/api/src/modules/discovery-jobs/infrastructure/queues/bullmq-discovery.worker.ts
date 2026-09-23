import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Worker } from 'bullmq';
import { QUEUE_NAMES } from '../../../../common/queue/queue.constants';
import { QueueInfrastructureService } from '../../../../common/queue/queue-infrastructure.service';
import { DiscoveryWorkerProcessorService } from '../../../company-discovery/application/services/discovery-worker-processor.service';
import type { DiscoveryJobPayload } from '../../application/ports/discovery-job.payload';

@Injectable()
export class BullMqDiscoveryWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BullMqDiscoveryWorker.name);
  private worker?: Worker<DiscoveryJobPayload>;

  constructor(
    private readonly configService: ConfigService,
    private readonly queueInfrastructureService: QueueInfrastructureService,
    private readonly discoveryWorkerProcessorService: DiscoveryWorkerProcessorService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.configService.get<string>('DISCOVERY_WORKER_ENABLED') !== 'true') {
      this.logger.log('Discovery worker disabled in this process.');
      return;
    }

    if (!this.queueInfrastructureService.hasConfiguredConnection()) {
      this.logger.warn('Discovery worker enabled but Redis is not configured; skipping queue worker startup.');
      return;
    }

    if (!(await this.queueInfrastructureService.hasHealthyConnection())) {
      this.logger.warn('Discovery worker enabled but Redis is unavailable; skipping queue worker startup.');
      return;
    }

    this.worker = this.queueInfrastructureService.createWorker<DiscoveryJobPayload>(
      QUEUE_NAMES.discovery,
      async (job) => {
        this.logger.log(
          `Start discovery job queue=${QUEUE_NAMES.discovery} bullJobId=${job.id ?? 'unknown'} businessJobId=${job.data.discoveryJobId} projectId=${job.data.projectId} attempt=${job.attemptsMade + 1}`,
        );
        await this.discoveryWorkerProcessorService.process(job);
        this.logger.log(
          `Completed discovery job queue=${QUEUE_NAMES.discovery} bullJobId=${job.id ?? 'unknown'} businessJobId=${job.data.discoveryJobId} projectId=${job.data.projectId}`,
        );
      },
      {
        concurrency: Number(this.configService.get<string>('DISCOVERY_WORKER_CONCURRENCY') ?? 2),
      },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Discovery job failed queue=${QUEUE_NAMES.discovery} bullJobId=${job?.id ?? 'unknown'} businessJobId=${job?.data.discoveryJobId ?? 'unknown'} projectId=${job?.data.projectId ?? 'unknown'} attempt=${job?.attemptsMade ?? 0} reason=${error.message}`,
      );
    });

    this.worker.on('error', (error) => {
      this.logger.error(`Discovery worker error queue=${QUEUE_NAMES.discovery} reason=${error.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
