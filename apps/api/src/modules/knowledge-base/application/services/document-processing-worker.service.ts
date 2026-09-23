import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Worker } from 'bullmq';
import { QUEUE_NAMES } from '../../../../common/queue/queue.constants';
import { QueueInfrastructureService } from '../../../../common/queue/queue-infrastructure.service';
import type { DocumentProcessingJobPayload } from '../ports/document-processing-job.payload';
import { DocumentProcessingService } from './document-processing.service';

@Injectable()
export class DocumentProcessingWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DocumentProcessingWorkerService.name);
  private worker?: Worker<DocumentProcessingJobPayload>;

  constructor(
    private readonly configService: ConfigService,
    private readonly queueInfrastructureService: QueueInfrastructureService,
    private readonly documentProcessingService: DocumentProcessingService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.configService.get<string>('DOCUMENT_WORKER_ENABLED') !== 'true') {
      this.logger.log('Document processing worker disabled in this process.');
      return;
    }

    if (!this.queueInfrastructureService.hasConfiguredConnection()) {
      this.logger.warn('Document processing worker enabled but Redis is not configured; skipping queue worker startup.');
      return;
    }

    if (!(await this.queueInfrastructureService.hasHealthyConnection())) {
      this.logger.warn('Document processing worker enabled but Redis is unavailable; skipping queue worker startup.');
      return;
    }

    this.worker = this.queueInfrastructureService.createWorker<DocumentProcessingJobPayload>(
      QUEUE_NAMES.documentProcessing,
      async (job) => {
        this.logger.log(
          `Start document job queue=${QUEUE_NAMES.documentProcessing} bullJobId=${job.id ?? 'unknown'} documentId=${job.data.documentId} projectId=${job.data.projectId} attempt=${job.attemptsMade + 1}`,
        );
        await this.documentProcessingService.process(job.data);
        this.logger.log(
          `Completed document job queue=${QUEUE_NAMES.documentProcessing} bullJobId=${job.id ?? 'unknown'} documentId=${job.data.documentId} projectId=${job.data.projectId}`,
        );
      },
      {
        concurrency: Number(this.configService.get<string>('DOCUMENT_WORKER_CONCURRENCY') ?? 1),
      },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Document job failed queue=${QUEUE_NAMES.documentProcessing} bullJobId=${job?.id ?? 'unknown'} documentId=${job?.data.documentId ?? 'unknown'} projectId=${job?.data.projectId ?? 'unknown'} reason=${error.message}`,
      );
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
