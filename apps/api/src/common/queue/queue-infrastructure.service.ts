import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, type JobsOptions, type Processor, type QueueOptions, type WorkerOptions } from 'bullmq';
import { RedisConnectionService } from '../redis/redis-connection.service';
import { RedisHealthService } from '../redis/redis-health.service';
import { DEFAULT_QUEUE_JOB_OPTIONS, type QueueName } from './queue.constants';

@Injectable()
export class QueueInfrastructureService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueInfrastructureService.name);
  private readonly queues = new Map<string, Queue>();
  private readonly workers = new Set<Worker>();

  constructor(
    private readonly redisConnectionService: RedisConnectionService,
    private readonly redisHealthService: RedisHealthService,
  ) {}

  getQueue<TPayload>(queueName: QueueName): Queue<TPayload> {
    const existingQueue = this.queues.get(queueName);

    if (existingQueue) {
      return existingQueue as Queue<TPayload>;
    }

    const queue = new Queue<TPayload>(queueName, this.getQueueOptions());
    queue.on('error', (error) => {
      this.logger.warn(`BullMQ queue unavailable: queue=${queueName}, error=${error.message}`);
    });
    this.queues.set(queueName, queue);
    return queue;
  }

  createWorker<TPayload>(
    queueName: QueueName,
    processor: Processor<TPayload>,
    options?: Pick<WorkerOptions, 'concurrency'>,
  ): Worker<TPayload> {
    const worker = new Worker<TPayload>(queueName, processor, {
      connection: this.redisConnectionService.getConnectionOptions(),
      concurrency: options?.concurrency,
    });

    this.workers.add(worker);
    worker.on('error', (error) => {
      this.logger.warn(`BullMQ worker connection error: queue=${queueName}, error=${error.message}`);
    });
    return worker;
  }

  getJobOptions(jobId: string, overrides?: JobsOptions): JobsOptions {
    return {
      ...DEFAULT_QUEUE_JOB_OPTIONS,
      ...overrides,
      jobId,
    };
  }

  hasConfiguredConnection(): boolean {
    return this.redisConnectionService.isConfigured;
  }

  async hasHealthyConnection(): Promise<boolean> {
    if (!this.hasConfiguredConnection()) {
      return false;
    }

    const result = await this.redisHealthService.check();
    return result.status === 'healthy';
  }

  async checkQueue(queueName: QueueName): Promise<'healthy' | 'degraded' | 'unavailable'> {
    try {
      const queue = this.getQueue(queueName);
      const client = (await queue.client) as unknown as { ping: () => Promise<string> };
      const response = await client.ping();
      return response === 'PONG' ? 'healthy' : 'degraded';
    } catch {
      return 'unavailable';
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([...this.workers].map((worker) => worker.close()));
    await Promise.allSettled([...this.queues.values()].map((queue) => queue.close()));
    this.logger.log('Closed BullMQ queues and workers.');
  }

  private getQueueOptions(): QueueOptions {
    return {
      connection: this.redisConnectionService.getConnectionOptions(),
    };
  }
}
