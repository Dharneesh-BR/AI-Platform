import type { AuthenticatedUser } from '../../../../common/auth';
import type { CompanyProfileEntity } from '../../domain/entities/company-profile.entity';

export const COMPANY_PROFILE_REPOSITORY = Symbol('COMPANY_PROFILE_REPOSITORY');

export interface UpdateCompanyProfileInput {
  organizationId: string;
  projectId: string;
  profileId: string;
  actor: AuthenticatedUser;
  mission?: string | null;
  vision?: string | null;
  industry?: string | null;
  targetCustomers?: string[];
  products?: string[];
  services?: string[];
  painPoints?: string[];
  uniqueSellingProposition?: string | null;
}

export interface CompanyProfileRepository {
  findLatestForProject(
    organizationId: string,
    projectId: string,
    actor: AuthenticatedUser,
  ): Promise<CompanyProfileEntity | null>;
  updateDraft(input: UpdateCompanyProfileInput): Promise<CompanyProfileEntity>;
  approve(
    organizationId: string,
    projectId: string,
    profileId: string,
    actor: AuthenticatedUser,
  ): Promise<CompanyProfileEntity>;
}