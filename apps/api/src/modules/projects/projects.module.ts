import { Module } from '@nestjs/common';
import { CreateProjectUseCase } from './application/use-cases/create-project.use-case';
import { DeleteProjectUseCase } from './application/use-cases/delete-project.use-case';
import { GetProjectUseCase } from './application/use-cases/get-project.use-case';
import { ListProjectsUseCase } from './application/use-cases/list-projects.use-case';
import { UpdateProjectUseCase } from './application/use-cases/update-project.use-case';
import { PROJECT_REPOSITORY } from './domain/repositories/project.repository';
import { PrismaProjectRepository } from './infrastructure/prisma/prisma-project.repository';
import { ProjectsController } from './presentation/controllers/projects.controller';

@Module({
  controllers: [ProjectsController],
  providers: [
    CreateProjectUseCase,
    DeleteProjectUseCase,
    GetProjectUseCase,
    ListProjectsUseCase,
    UpdateProjectUseCase,
    {
      provide: PROJECT_REPOSITORY,
      useClass: PrismaProjectRepository,
    },
  ],
  exports: [PROJECT_REPOSITORY],
})
export class ProjectsModule {}