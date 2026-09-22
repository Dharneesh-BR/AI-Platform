import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/auth';
import {
  PROJECT_PROFILE_REPOSITORY,
  type ProjectProfileRepository,
} from '../../../project-profile/application/ports/project-profile.repository';
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
    @Inject(PROJECT_PROFILE_REPOSITORY)
    private readonly projectProfileRepository: ProjectProfileRepository,
  ) {}

  async execute(projectId: string, actor: AuthenticatedUser): Promise<CompanyProfileEntity> {
    const profile = await this.companyProfileRepository.findLatestForProject(
      projectId,
      actor,
    );

    if (profile) {
      return profile;
    }

    const projectProfile = await this.projectProfileRepository.findByProjectId(
      projectId,
      actor,
    );

    if (!projectProfile) {
      throw new NotFoundException('Company profile not found.');
    }

    return {
      id: `draft-${projectProfile.id}`,
      projectId,
      version: 1,
      isApproved: false,
      mission: `${projectProfile.companyName} is being prepared for AI-assisted strategy, research, and execution.`,
      vision: 'Discovery is still building the full company profile. This draft is based on the onboarding basics.',
      industry: projectProfile.industry,
      targetCustomers: projectProfile.targetMarket ? [projectProfile.targetMarket] : [],
      products: [],
      services: projectProfile.businessModel ? [projectProfile.businessModel] : [],
      painPoints: projectProfile.primaryChallenges,
      uniqueSellingProposition: projectProfile.businessGoals.length
        ? projectProfile.businessGoals.join(', ')
        : null,
      summaries: {
        executiveSummary: 'Discovery has not completed yet. This draft is based on onboarding basics.',
        aiReadiness: 'Pending discovery.',
      },
      sourceMetadata: {
        generatedBy: 'onboarding-draft',
      },
    };
  }
}
