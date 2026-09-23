import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import { QUEUE_NAMES } from '../../../../common/queue/queue.constants';
import { QueueInfrastructureService } from '../../../../common/queue/queue-infrastructure.service';
import type { AgentExecutionJobPayload } from '../../application/ports/agent-execution-job.payload';
import { AgentRuntimeService } from '../../application/runtime/agent-runtime.service';

@Injectable()
export class AgentExecutionWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AgentExecutionWorker.name);
  private worker?: Worker<AgentExecutionJobPayload>;

  constructor(
    private readonly queueInfrastructure: QueueInfrastructureService,
    private readonly agentRuntimeService: AgentRuntimeService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.AGENT_WORKER_ENABLED !== 'true') {
      this.logger.log('AI execution worker disabled in this process.');
      return;
    }

    if (!this.queueInfrastructure.hasConfiguredConnection()) {
      this.logger.warn('AI execution worker enabled but Redis is not configured; skipping queue worker startup.');
      return;
    }

    if (!(await this.queueInfrastructure.hasHealthyConnection())) {
      this.logger.warn('AI execution worker enabled but Redis is unavailable; skipping queue worker startup.');
      return;
    }

    const concurrency = Number.parseInt(process.env.AGENT_WORKER_CONCURRENCY ?? '1', 10);
    this.worker = this.queueInfrastructure.createWorker<AgentExecutionJobPayload>(
      QUEUE_NAMES.aiExecution,
      async (job) => {
        this.logger.log(`Processing AI execution job ${job.id} for run ${job.data.agentRunId}.`);
        await this.agentRuntimeService.executeRun(job.data.agentRunId);
      },
      { concurrency: Number.isFinite(concurrency) && concurrency > 0 ? concurrency : 1 },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(`AI execution job failed: jobId=${job?.id}, error=${error.message}`);
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
