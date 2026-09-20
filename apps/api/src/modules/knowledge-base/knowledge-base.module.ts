import { Module } from '@nestjs/common';
import { QueueModule } from '../../common/queue/queue.module';
import { AiModule } from '../ai/ai.module';
import { RESEARCH_SOURCE_REPOSITORY } from './application/ports/research-source.repository';
import { DocumentChunkingService } from './application/services/document-chunking.service';
import { DocumentProcessingService } from './application/services/document-processing.service';
import { DocumentProcessingWorkerService } from './application/services/document-processing-worker.service';
import { DocumentTextExtractionService } from './application/services/document-text-extraction.service';
import { EmbeddingService } from './application/services/embedding.service';
import { KnowledgeDocumentService } from './application/services/knowledge-document.service';
import { RagConfigService } from './application/services/rag-config.service';
import { RagContextService } from './application/services/rag-context.service';
import { VectorSearchService } from './application/services/vector-search.service';
import { CreateProjectKnowledgeSourceUseCase } from './application/use-cases/create-project-knowledge-source.use-case';
import { GetProjectKnowledgeUseCase } from './application/use-cases/get-project-knowledge.use-case';
import { PrismaResearchSourceRepository } from './infrastructure/prisma/prisma-research-source.repository';
import { LocalKnowledgeStorageService } from './infrastructure/storage/local-knowledge-storage.service';
import { ProjectKnowledgeController } from './presentation/controllers/project-knowledge.controller';

@Module({
  imports: [AiModule, QueueModule],
  controllers: [ProjectKnowledgeController],
  providers: [
    CreateProjectKnowledgeSourceUseCase,
    DocumentChunkingService,
    DocumentProcessingService,
    DocumentProcessingWorkerService,
    DocumentTextExtractionService,
    EmbeddingService,
    GetProjectKnowledgeUseCase,
    KnowledgeDocumentService,
    LocalKnowledgeStorageService,
    RagConfigService,
    RagContextService,
    VectorSearchService,
    {
      provide: RESEARCH_SOURCE_REPOSITORY,
      useClass: PrismaResearchSourceRepository,
    },
  ],
  exports: [RagContextService, VectorSearchService],
})
export class KnowledgeBaseModule {}
