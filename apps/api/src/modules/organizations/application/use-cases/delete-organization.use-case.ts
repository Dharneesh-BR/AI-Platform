import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/auth';
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository,
} from '../../domain/repositories/organization.repository';

@Injectable()
export class DeleteOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(id: string, actor: AuthenticatedUser): Promise<{ success: true }> {
    await this.organizationRepository.softDelete(id, actor);
    return { success: true };
  }
}

