import type { AuthenticatedUser } from '../../../../common/auth';
import type { ResearchSourceEntity } from '../../domain/entities/research-source.entity';

export const RESEARCH_SOURCE_REPOSITORY = Symbol('RESEARCH_SOURCE_REPOSITORY');

export interface ResearchSourceRepository {
  listForProject(
    organizationId: string,
    projectId: string,
    actor: AuthenticatedUser,
  ): Promise<ResearchSourceEntity[]>;
}

