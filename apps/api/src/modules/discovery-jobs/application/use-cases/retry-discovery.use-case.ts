import { Inject, Injectable, Logger } from '@nestjs/common';
import { ProjectLifecycleState } from '@platform/domain';
import type { AuthenticatedUser } from '../../../../common/auth';
import {
  PROJECT_PROFILE_REPOSITORY,
  type ProjectProfileRepository,
} from '../../../project-profile/application/ports/project-profile.repository';
import { DiscoveryWorkerProcessorService } from '../../../company-discovery/application/services/discovery-worker-processor.service';
import {
  PROJECT_LIFECYCLE_REPOSITORY,
  type ProjectLifecycleRepository,
} from '../../../onboarding/application/ports/project-lifecycle.repository';
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
    @Inject(PROJECT_LIFECYCLE_REPOSITORY)
    private readonly projectLifecycleRepository: ProjectLifecycleRepository,
    private readonly discoveryWorkerProcessorService: DiscoveryWorkerProcessorService,
  ) {}

  async execute(
    projectId: string,
    actor: AuthenticatedUser,
    idempotencyKey?: string,
  ): Promise<{ discoveryJobId: string }> {
    const profile = await this.projectProfileRepository.findOrCreateDefault(projectId, actor);
    await this.projectLifecycleRepository.transition(
      projectId,
      ProjectLifecycleState.DiscoveryPending,
      actor,
    );
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

    if (process.env.DISCOVERY_QUEUE_ENABLED === 'true') {
      try {
        await this.discoveryQueue.enqueue(job, discoveryPayload);
      } catch (error) {
        this.logger.warn(
          `Discovery retry queue unavailable; continuing with inline discovery. jobId=${job.id} reason=${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    if (process.env.DISCOVERY_INLINE_DISABLED !== 'true') {
      await this.discoveryWorkerProcessorService.processPayload({
        discoveryJobId: job.id,
        projectId,
        actorUserId: actor.id,
        ...discoveryPayload,
      });
    }

    return { discoveryJobId: job.id };
  }
}
