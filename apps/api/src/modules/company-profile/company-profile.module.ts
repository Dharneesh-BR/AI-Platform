import { Module } from '@nestjs/common';
import { ProjectProfileModule } from '../project-profile/project-profile.module';
import { COMPANY_PROFILE_REPOSITORY } from './application/ports/company-profile.repository';
import { ApproveCompanyProfileUseCase } from './application/use-cases/approve-company-profile.use-case';
import { GetCompanyProfileUseCase } from './application/use-cases/get-company-profile.use-case';
import { UpdateCompanyProfileUseCase } from './application/use-cases/update-company-profile.use-case';
import { PrismaCompanyProfileRepository } from './infrastructure/prisma/prisma-company-profile.repository';
import { CompanyProfileController } from './presentation/controllers/company-profile.controller';

@Module({
  imports: [ProjectProfileModule],
  controllers: [CompanyProfileController],
  providers: [
    ApproveCompanyProfileUseCase,
    GetCompanyProfileUseCase,
    UpdateCompanyProfileUseCase,
    {
      provide: COMPANY_PROFILE_REPOSITORY,
      useClass: PrismaCompanyProfileRepository,
    },
  ],
  exports: [COMPANY_PROFILE_REPOSITORY],
})
export class CompanyProfileModule {}
