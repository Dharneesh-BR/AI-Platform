import { Module } from '@nestjs/common';
import { RESEARCH_SOURCE_REPOSITORY } from './application/ports/research-source.repository';
import { GetProjectKnowledgeUseCase } from './application/use-cases/get-project-knowledge.use-case';
import { PrismaResearchSourceRepository } from './infrastructure/prisma/prisma-research-source.repository';
import { ProjectKnowledgeController } from './presentation/controllers/project-knowledge.controller';

@Module({
  controllers: [ProjectKnowledgeController],
  providers: [
    GetProjectKnowledgeUseCase,
    {
      provide: RESEARCH_SOURCE_REPOSITORY,
      useClass: PrismaResearchSourceRepository,
    },
  ],
})
export class KnowledgeBaseModule {}
