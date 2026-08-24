import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/auth';
import type { CompanyProfileEntity } from '../../domain/entities/company-profile.entity';
import {
  COMPANY_PROFILE_REPOSITORY,
  type CompanyProfileRepository,
} from '../ports/company-profile.repository';

@Injectable()
export class ApproveCompanyProfileUseCase {
  constructor(
    @Inject(COMPANY_PROFILE_REPOSITORY)
    private readonly companyProfileRepository: CompanyProfileRepository,
  ) {}

  execute(
    organizationId: string,
    projectId: string,
    profileId: string,
    actor: AuthenticatedUser,
  ): Promise<CompanyProfileEntity> {
    return this.companyProfileRepository.approve(organizationId, projectId, profileId, actor);
  }
}