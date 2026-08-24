import { Inject, Injectable } from '@nestjs/common';
import type { CompanyProfileEntity } from '../../domain/entities/company-profile.entity';
import {
  COMPANY_PROFILE_REPOSITORY,
  type CompanyProfileRepository,
  type UpdateCompanyProfileInput,
} from '../ports/company-profile.repository';

@Injectable()
export class UpdateCompanyProfileUseCase {
  constructor(
    @Inject(COMPANY_PROFILE_REPOSITORY)
    private readonly companyProfileRepository: CompanyProfileRepository,
  ) {}

  execute(input: UpdateCompanyProfileInput): Promise<CompanyProfileEntity> {
    return this.companyProfileRepository.updateDraft(input);
  }
}