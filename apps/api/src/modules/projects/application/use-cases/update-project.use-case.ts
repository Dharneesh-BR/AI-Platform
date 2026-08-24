import { Inject, Injectable } from '@nestjs/common';
import type { ProjectEntity } from '../../domain/entities/project.entity';
import { PROJECT_REPOSITORY, type ProjectRepository, type UpdateProjectInput } from '../../domain/repositories/project.repository';

@Injectable()
export class UpdateProjectUseCase {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly projectRepository: ProjectRepository) {}

  execute(input: UpdateProjectInput): Promise<ProjectEntity> {
    return this.projectRepository.update(input);
  }
}