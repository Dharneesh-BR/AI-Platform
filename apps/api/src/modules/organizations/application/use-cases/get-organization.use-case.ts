import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/auth';
import type { OrganizationEntity } from '../../domain/entities/organization.entity';
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository,
} from '../../domain/repositories/organization.repository';

@Injectable()
export class GetOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(id: string, actor: AuthenticatedUser): Promise<OrganizationEntity> {
    const organization = await this.organizationRepository.findById(id, actor);

    if (!organization) {
      throw new NotFoundException('Organization not found.');
    }

    return organization;
  }
}

