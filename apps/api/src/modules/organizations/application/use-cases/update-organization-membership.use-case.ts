import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser, PlatformRole } from '../../../../common/auth';
import type { OrganizationMembershipEntity } from '../../domain/entities/organization-membership.entity';
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository,
} from '../../domain/repositories/organization.repository';

export interface UpdateOrganizationMembershipCommand {
  organizationId: string;
  membershipId: string;
  role?: PlatformRole;
  status?: string;
  actor: AuthenticatedUser;
}

@Injectable()
export class UpdateOrganizationMembershipUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  execute(command: UpdateOrganizationMembershipCommand): Promise<OrganizationMembershipEntity> {
    return this.organizationRepository.updateMembership(command);
  }
}

