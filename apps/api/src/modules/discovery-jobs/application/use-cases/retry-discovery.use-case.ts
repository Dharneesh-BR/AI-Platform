import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { AuthenticatedUser } from '../../../../common/auth';
import { DiscoveryWorkerProcessorService } from '../../../company-discovery/application/services/discovery-worker-processor.service';
import {
  PROJECT_PROFILE_REPOSITORY,
  type ProjectProfileRepository,
} from '../../../project-profile/application/ports/project-profile.repository';
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
  private readonly logger = new Logger(RetryDiscoveryUseCase.name);

  constructor(
    @Inject(DISCOVERY_JOB_REPOSITORY)
    private readonly discoveryJobRepository: DiscoveryJobRepository,
    @Inject(DISCOVERY_QUEUE)
    private readonly discoveryQueue: DiscoveryQueue,
    @Inject(PROJECT_PROFILE_REPOSITORY)
    private readonly projectProfileRepository: ProjectProfileRepository,
    private readonly moduleRef: ModuleRef,
  ) {}

  async execute(
    projectId: string,
    actor: AuthenticatedUser,
    idempotencyKey?: string,
  ): Promise<{ discoveryJobId: string }> {
    const profile = await this.projectProfileRepository.findOrCreateDefault(projectId, actor);
    const job = await this.discoveryJobRepository.createPending(
      projectId,
      actor,
      idempotencyKey,
    );
    const discoveryPayload = {
      companyName: profile.companyName,
      websiteUrl: profile.websiteUrl,
      industry: profile.industry,
      businessGoals: profile.businessGoals,
      primaryChallenges: profile.primaryChallenges,
      competitors: profile.competitors,
    };

    try {
      await this.discoveryQueue.enqueue(job, discoveryPayload);
    } catch (error) {
      if (process.env.DISCOVERY_INLINE_DISABLED === 'true') {
        throw new ServiceUnavailableException('Discovery queue is unavailable. Please check Redis/BullMQ configuration.');
      }

      this.logger.warn(
        `Discovery retry queue unavailable; processing inline. jobId=${job.id} reason=${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      const processor = this.moduleRef.get(DiscoveryWorkerProcessorService, { strict: false });
      await processor.processPayload({
        discoveryJobId: job.id,
        projectId,
        actorUserId: actor.id,
        ...discoveryPayload,
      });
    }

    return { discoveryJobId: job.id };
  }
}
