import { Module } from '@nestjs/common';
import { CompanyDiscoveryModule } from '../company-discovery/company-discovery.module';
import { DiscoveryJobsModule } from '../discovery-jobs/discovery-jobs.module';
import { ProjectProfileModule } from '../project-profile/project-profile.module';
import { PROJECT_LIFECYCLE_REPOSITORY } from './application/ports/project-lifecycle.repository';
import { CompleteOnboardingUseCase } from './application/use-cases/complete-onboarding.use-case';
import { StartOnboardingUseCase } from './application/use-cases/start-onboarding.use-case';
import { PrismaProjectLifecycleRepository } from './infrastructure/prisma/prisma-project-lifecycle.repository';
import { OnboardingController } from './presentation/controllers/onboarding.controller';

@Module({
  imports: [ProjectProfileModule, DiscoveryJobsModule, CompanyDiscoveryModule],
  controllers: [OnboardingController],
  providers: [
    StartOnboardingUseCase,
    CompleteOnboardingUseCase,
    {
      provide: PROJECT_LIFECYCLE_REPOSITORY,
      useClass: PrismaProjectLifecycleRepository,
    },
  ],
  exports: [PROJECT_LIFECYCLE_REPOSITORY],
})
export class OnboardingModule {}
