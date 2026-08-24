import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser, PlatformRole } from '../../../../common/auth';
import type { OrganizationMembershipEntity } from '../../domain/entities/organization-membership.entity';
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository,
} from '../../domain/repositories/organization.repository';

export interface AddOrganizationMembershipCommand {
  organizationId: string;
  userId: string;
  role: PlatformRole;
  actor: AuthenticatedUser;
}

@Injectable()
export class AddOrganizationMembershipUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  execute(command: AddOrganizationMembershipCommand): Promise<OrganizationMembershipEntity> {
    return this.organizationRepository.addMembership(command);
  }
}

