import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/auth';
import {
  DISCOVERY_JOB_REPOSITORY,
  type DiscoveryJobRepository,
} from '../ports/discovery-job.repository';
import {
  DISCOVERY_QUEUE,
  type DiscoveryQueue,
} from '../ports/discovery-queue.port';

@Injectable()
export class RetryDiscoveryUseCase {
  constructor(
    @Inject(DISCOVERY_JOB_REPOSITORY)
    private readonly discoveryJobRepository: DiscoveryJobRepository,
    @Inject(DISCOVERY_QUEUE)
    private readonly discoveryQueue: DiscoveryQueue,
  ) {}

  async execute(
    projectId: string,
    actor: AuthenticatedUser,
    idempotencyKey?: string,
  ): Promise<{ discoveryJobId: string }> {
    const job = await this.discoveryJobRepository.createPending(
      projectId,
      actor,
      idempotencyKey,
    );
    await this.discoveryQueue.enqueue(job);
    return { discoveryJobId: job.id };
  }
}
