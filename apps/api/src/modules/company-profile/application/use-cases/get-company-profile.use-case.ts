import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/auth';
import type { CompanyProfileEntity } from '../../domain/entities/company-profile.entity';
import {
  COMPANY_PROFILE_REPOSITORY,
  type CompanyProfileRepository,
} from '../ports/company-profile.repository';

@Injectable()
export class GetCompanyProfileUseCase {
  constructor(
    @Inject(COMPANY_PROFILE_REPOSITORY)
    private readonly companyProfileRepository: CompanyProfileRepository,
  ) {}

  async execute(
    organizationId: string,
    projectId: string,
    actor: AuthenticatedUser,
  ): Promise<CompanyProfileEntity> {
    const profile = await this.companyProfileRepository.findLatestForProject(
      organizationId,
      projectId,
      actor,
    );

    if (!profile) {
      throw new NotFoundException('Company profile not found.');
    }

    return profile;
  }
}

