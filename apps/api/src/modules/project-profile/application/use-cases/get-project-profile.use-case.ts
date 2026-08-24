import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/auth';
import type { ProjectProfileEntity } from '../../domain/entities/project-profile.entity';
import {
  PROJECT_PROFILE_REPOSITORY,
  type ProjectProfileRepository,
} from '../ports/project-profile.repository';

@Injectable()
export class GetProjectProfileUseCase {
  constructor(
    @Inject(PROJECT_PROFILE_REPOSITORY)
    private readonly projectProfileRepository: ProjectProfileRepository,
  ) {}

  async execute(
    organizationId: string,
    projectId: string,
    actor: AuthenticatedUser,
  ): Promise<ProjectProfileEntity> {
    const profile = await this.projectProfileRepository.findByProjectId(
      organizationId,
      projectId,
      actor,
    );

    if (!profile) {
      throw new NotFoundException('Project profile not found.');
    }

    return profile;
  }
}

