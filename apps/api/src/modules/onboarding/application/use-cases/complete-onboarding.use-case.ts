import { Inject, Injectable } from '@nestjs/common';
import { ProjectLifecycleState } from '@platform/domain';
import type { AuthenticatedUser } from '../../../../common/auth';
import {
  PROJECT_PROFILE_REPOSITORY,
  type ProjectProfileRepository,
} from '../../../project-profile/application/ports/project-profile.repository';
import {
  DISCOVERY_JOB_REPOSITORY,
  type DiscoveryJobRepository,
} from '../../../discovery-jobs/application/ports/discovery-job.repository';
import {
  DISCOVERY_QUEUE,
  type DiscoveryQueue,
} from '../../../discovery-jobs/application/ports/discovery-queue.port';
import { DiscoveryWorkerProcessorService } from '../../../company-discovery/application/services/discovery-worker-processor.service';
import {
  PROJECT_LIFECYCLE_REPOSITORY,
  type ProjectLifecycleRepository,
} from '../ports/project-lifecycle.repository';

@Injectable()
export class CompleteOnboardingUseCase {
  constructor(
    @Inject(PROJECT_PROFILE_REPOSITORY)
    private readonly projectProfileRepository: ProjectProfileRepository,
    @Inject(PROJECT_LIFECYCLE_REPOSITORY)
    private readonly projectLifecycleRepository: ProjectLifecycleRepository,
    @Inject(DISCOVERY_JOB_REPOSITORY)
    private readonly discoveryJobRepository: DiscoveryJobRepository,
    @Inject(DISCOVERY_QUEUE)
    private readonly discoveryQueue: DiscoveryQueue,
    private readonly discoveryWorkerProcessorService: DiscoveryWorkerProcessorService,
  ) {}

  async execute(
    organizationId: string,
    projectId: string,
    actor: AuthenticatedUser,
    idempotencyKey?: string,
  ): Promise<{ state: ProjectLifecycleState; discoveryJobId: string }> {
    const profile = await this.projectProfileRepository.complete(organizationId, projectId, actor);
    const state = await this.projectLifecycleRepository.transition(
      organizationId,
      projectId,
      ProjectLifecycleState.DiscoveryPending,
      actor,
    );
    const job = await this.discoveryJobRepository.createPending(
      organizationId,
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

    await this.discoveryQueue.enqueue(job, discoveryPayload);

    if (process.env.DISCOVERY_WORKER_ENABLED !== 'true') {
      await this.discoveryWorkerProcessorService.processPayload({
        discoveryJobId: job.id,
        organizationId,
        projectId,
        actorUserId: actor.id,
        ...discoveryPayload,
      });
    }

    return {
      state,
      discoveryJobId: job.id,
    };
  }
}
