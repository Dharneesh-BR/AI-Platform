import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/auth';
import { PROJECT_REPOSITORY, type ProjectRepository } from '../../domain/repositories/project.repository';

@Injectable()
export class DeleteProjectUseCase {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly projectRepository: ProjectRepository) {}

  async execute(projectId: string, actor: AuthenticatedUser): Promise<{ success: true }> {
    await this.projectRepository.delete(projectId, actor);
    return { success: true };
  }
}
