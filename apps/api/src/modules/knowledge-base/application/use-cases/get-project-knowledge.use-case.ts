import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/auth';
import type { ResearchSourceEntity } from '../../domain/entities/research-source.entity';
import {
  RESEARCH_SOURCE_REPOSITORY,
  type ResearchSourceRepository,
} from '../ports/research-source.repository';

@Injectable()
export class GetProjectKnowledgeUseCase {
  constructor(
    @Inject(RESEARCH_SOURCE_REPOSITORY)
    private readonly researchSourceRepository: ResearchSourceRepository,
  ) {}

  execute(
    organizationId: string,
    projectId: string,
    actor: AuthenticatedUser,
  ): Promise<ResearchSourceEntity[]> {
    return this.researchSourceRepository.listForProject(organizationId, projectId, actor);
  }
}

