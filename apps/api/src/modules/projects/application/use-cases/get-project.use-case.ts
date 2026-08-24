import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/auth';
import type { ProjectEntity } from '../../domain/entities/project.entity';
import { PROJECT_REPOSITORY, type ProjectRepository } from '../../domain/repositories/project.repository';

@Injectable()
export class GetProjectUseCase {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly projectRepository: ProjectRepository) {}

  async execute(organizationId: string, projectId: string, actor: AuthenticatedUser): Promise<ProjectEntity> {
    const project = await this.projectRepository.findById(organizationId, projectId, actor);
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    return project;
  }
}