import { Inject, Injectable } from '@nestjs/common';
import { ProjectLifecycleState } from '@platform/domain';
import type { AuthenticatedUser } from '../../../../common/auth';
import {
  PROJECT_LIFECYCLE_REPOSITORY,
  type ProjectLifecycleRepository,
} from '../ports/project-lifecycle.repository';

@Injectable()
export class StartOnboardingUseCase {
  constructor(
    @Inject(PROJECT_LIFECYCLE_REPOSITORY)
    private readonly projectLifecycleRepository: ProjectLifecycleRepository,
  ) {}

  async execute(
    organizationId: string,
    projectId: string,
    actor: AuthenticatedUser,
  ): Promise<{ state: ProjectLifecycleState }> {
    const state = await this.projectLifecycleRepository.transition(
      organizationId,
      projectId,
      ProjectLifecycleState.Onboarding,
      actor,
    );

    return { state };
  }
}

