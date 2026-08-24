import type { AuthenticatedUser, PlatformRole } from '../../../../common/auth';
import type { OrganizationEntity } from '../entities/organization.entity';
import type { OrganizationMembershipEntity } from '../entities/organization-membership.entity';

export const ORGANIZATION_REPOSITORY = Symbol('ORGANIZATION_REPOSITORY');

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  description?: string;
  actor: AuthenticatedUser;
}

export interface UpdateOrganizationInput {
  id: string;
  name?: string;
  description?: string | null;
  actor: AuthenticatedUser;
}

export interface AddOrganizationMembershipInput {
  organizationId: string;
  userId: string;
  role: PlatformRole;
  actor: AuthenticatedUser;
}

export interface UpdateOrganizationMembershipInput {
  organizationId: string;
  membershipId: string;
  role?: PlatformRole;
  status?: string;
  actor: AuthenticatedUser;
}

export interface OrganizationRepository {
  create(input: CreateOrganizationInput): Promise<OrganizationEntity>;
  listForUser(actor: AuthenticatedUser): Promise<OrganizationEntity[]>;
  findById(id: string, actor: AuthenticatedUser): Promise<OrganizationEntity | null>;
  update(input: UpdateOrganizationInput): Promise<OrganizationEntity>;
  softDelete(id: string, actor: AuthenticatedUser): Promise<void>;
  addMembership(input: AddOrganizationMembershipInput): Promise<OrganizationMembershipEntity>;
  updateMembership(
    input: UpdateOrganizationMembershipInput,
  ): Promise<OrganizationMembershipEntity>;
}

