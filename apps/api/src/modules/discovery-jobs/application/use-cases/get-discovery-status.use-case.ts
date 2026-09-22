import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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

    if (!job) {
      throw new NotFoundException('Discovery job not found.');
    }

    return job;
  }
}
