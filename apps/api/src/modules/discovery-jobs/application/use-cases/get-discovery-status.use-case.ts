import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/auth';
import type { DiscoveryJobEntity } from '../../domain/entities/discovery-job.entity';
import {
  DISCOVERY_JOB_REPOSITORY,
  type DiscoveryJobRepository,
} from '../ports/discovery-job.repository';

@Injectable()
export class GetDiscoveryStatusUseCase {
  constructor(
    @Inject(DISCOVERY_JOB_REPOSITORY)
    private readonly discoveryJobRepository: DiscoveryJobRepository,
  ) {}

  async execute(projectId: string, actor: AuthenticatedUser): Promise<DiscoveryJobEntity> {
    const job = await this.discoveryJobRepository.findLatest(projectId, actor);

    return job ?? {
      id: '',
      projectId,
      status: 'NOT_STARTED',
      progress: 0,
      currentStep: null,
      steps: [],
      errorMessage: null,
      createdBy: actor.id,
    };
  }
}
