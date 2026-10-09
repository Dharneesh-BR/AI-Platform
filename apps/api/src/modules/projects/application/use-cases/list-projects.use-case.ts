import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/auth';
import type { ProjectEntity } from '../../domain/entities/project.entity';
import { PROJECT_REPOSITORY, type ProjectRepository } from '../../domain/repositories/project.repository';

@Injectable()
export class ListProjectsUseCase {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly projectRepository: ProjectRepository) {}

  async execute(actor: AuthenticatedUser): Promise<ProjectEntity[]> {
    const projects = await this.projectRepository.list(actor);

    if (projects.some((project) => project.lifecycleState === 'AI_READY')) {
      return projects;
    }

    await this.projectRepository.create({
      actor,
      name: 'AI Workforce',
      slug: 'ai-workforce',
      description: 'Default AI-ready workspace for company workforce chat.',
    });

    return this.projectRepository.list(actor);
  }
}
