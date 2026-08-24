import { Inject, Injectable } from '@nestjs/common';
import type { ProjectEntity } from '../../domain/entities/project.entity';
import { PROJECT_REPOSITORY, type CreateProjectInput, type ProjectRepository } from '../../domain/repositories/project.repository';

@Injectable()
export class CreateProjectUseCase {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly projectRepository: ProjectRepository) {}

  execute(input: CreateProjectInput): Promise<ProjectEntity> {
    return this.projectRepository.create(input);
  }
}