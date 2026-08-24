import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/auth';
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository,
} from '../../domain/repositories/organization.repository';
import type { OrganizationEntity } from '../../domain/entities/organization.entity';

export interface CreateOrganizationCommand {
  name: string;
  slug: string;
  description?: string;
  actor: AuthenticatedUser;
}

@Injectable()
export class CreateOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  execute(command: CreateOrganizationCommand): Promise<OrganizationEntity> {
    return this.organizationRepository.create(command);
  }
}

