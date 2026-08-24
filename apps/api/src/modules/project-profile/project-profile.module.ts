import { Module } from '@nestjs/common';
import { PROJECT_PROFILE_REPOSITORY } from './application/ports/project-profile.repository';
import { GetProjectProfileUseCase } from './application/use-cases/get-project-profile.use-case';
import { UpsertProjectProfileUseCase } from './application/use-cases/upsert-project-profile.use-case';
import { PrismaProjectProfileRepository } from './infrastructure/prisma/prisma-project-profile.repository';
import { ProjectProfileController } from './presentation/controllers/project-profile.controller';

@Module({
  controllers: [ProjectProfileController],
  providers: [
    GetProjectProfileUseCase,
    UpsertProjectProfileUseCase,
    {
      provide: PROJECT_PROFILE_REPOSITORY,
      useClass: PrismaProjectProfileRepository,
    },
  ],
  exports: [PROJECT_PROFILE_REPOSITORY],
})
export class ProjectProfileModule {}

