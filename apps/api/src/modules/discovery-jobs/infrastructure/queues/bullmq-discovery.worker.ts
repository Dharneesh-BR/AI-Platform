import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';
import {
  DiscoveryWorkerProcessorService,
  type CompanyDiscoveryJobPayload,
} from '../../../company-discovery/application/services/discovery-worker-processor.service';

@Injectable()
export class BullMqDiscoveryWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BullMqDiscoveryWorker.name);
  private worker?: Worker<CompanyDiscoveryJobPayload>;

  constructor(
    private readonly configService: ConfigService,
    private readonly discoveryWorkerProcessorService: DiscoveryWorkerProcessorService,
  ) {}

  onModuleInit(): void {
    if (this.configService.get<string>('DISCOVERY_WORKER_ENABLED') !== 'true') {
      this.logger.log('Discovery worker disabled in this process.');
      return;
    }

    const redisUrl = new URL(this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379');
    this.worker = new Worker<CompanyDiscoveryJobPayload>(
      'discovery',
      async (job) => this.discoveryWorkerProcessorService.process(job),
      {
        connection: {
          host: redisUrl.hostname,
          port: Number(redisUrl.port || 6379),
          password: redisUrl.password || undefined,
        },
        concurrency: Number(this.configService.get<string>('DISCOVERY_WORKER_CONCURRENCY') ?? 2),
      },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(`Discovery job failed: ${job?.id ?? 'unknown'} ${error.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}