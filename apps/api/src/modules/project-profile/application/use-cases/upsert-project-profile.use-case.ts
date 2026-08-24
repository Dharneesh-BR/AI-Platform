import { Inject, Injectable } from '@nestjs/common';
import type { ProjectProfileEntity } from '../../domain/entities/project-profile.entity';
import {
  PROJECT_PROFILE_REPOSITORY,
  type ProjectProfileRepository,
  type UpsertProjectProfileInput,
} from '../ports/project-profile.repository';

@Injectable()
export class UpsertProjectProfileUseCase {
  constructor(
    @Inject(PROJECT_PROFILE_REPOSITORY)
    private readonly projectProfileRepository: ProjectProfileRepository,
  ) {}

  execute(input: UpsertProjectProfileInput): Promise<ProjectProfileEntity> {
    return this.projectProfileRepository.upsert(input);
  }
}

