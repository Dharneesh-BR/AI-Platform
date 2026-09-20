import type { AuthenticatedUser } from '../../../../common/auth';
import type { ProjectProfileEntity } from '../../domain/entities/project-profile.entity';

export const PROJECT_PROFILE_REPOSITORY = Symbol('PROJECT_PROFILE_REPOSITORY');

export interface UpsertProjectProfileInput {
  organizationId: string;
  projectId: string;
  actor: AuthenticatedUser;
  companyName: string;
  websiteUrl?: string | null;
  industry?: string | null;
  companySize?: string | null;
  businessModel?: string | null;
  targetMarket?: string | null;
  businessGoals?: string[];
  primaryChallenges?: string[];
  competitors?: string[];
  documents?: unknown[];
  brandGuidelines?: unknown[];
  strategyDocuments?: unknown[];
  onboardingStep?: string | null;
}

export interface ProjectProfileRepository {
  findByProjectId(
    organizationId: string,
    projectId: string,
    actor: AuthenticatedUser,
  ): Promise<ProjectProfileEntity | null>;
  findOrCreateDefault(
    organizationId: string,
    projectId: string,
    actor: AuthenticatedUser,
  ): Promise<ProjectProfileEntity>;
  upsert(input: UpsertProjectProfileInput): Promise<ProjectProfileEntity>;
  complete(
    organizationId: string,
    projectId: string,
    actor: AuthenticatedUser,
  ): Promise<ProjectProfileEntity>;
}
