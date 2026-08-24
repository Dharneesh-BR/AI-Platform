import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/auth';
import type { OrganizationEntity } from '../../domain/entities/organization.entity';
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository,
} from '../../domain/repositories/organization.repository';

@Injectable()
export class ListOrganizationsUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  execute(actor: AuthenticatedUser): Promise<OrganizationEntity[]> {
    return this.organizationRepository.listForUser(actor);
  }
}

