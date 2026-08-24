import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/auth';
import type { ProjectEntity } from '../../domain/entities/project.entity';
import { PROJECT_REPOSITORY, type ProjectRepository } from '../../domain/repositories/project.repository';

@Injectable()
export class ListProjectsUseCase {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly projectRepository: ProjectRepository) {}

  execute(organizationId: string, actor: AuthenticatedUser): Promise<ProjectEntity[]> {
    return this.projectRepository.list(organizationId, actor);
  }
}