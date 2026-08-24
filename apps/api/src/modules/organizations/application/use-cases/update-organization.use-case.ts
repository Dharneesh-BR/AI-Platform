import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/auth';
import type { OrganizationEntity } from '../../domain/entities/organization.entity';
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository,
} from '../../domain/repositories/organization.repository';

export interface UpdateOrganizationCommand {
  id: string;
  name?: string;
  description?: string | null;
  actor: AuthenticatedUser;
}

@Injectable()
export class UpdateOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  execute(command: UpdateOrganizationCommand): Promise<OrganizationEntity> {
    return this.organizationRepository.update(command);
  }
}

