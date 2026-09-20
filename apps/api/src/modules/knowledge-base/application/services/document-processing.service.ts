import { Injectable, Logger } from '@nestjs/common';
import { KnowledgeDocumentStatus, ResearchSourceType } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { LocalKnowledgeStorageService } from '../../infrastructure/storage/local-knowledge-storage.service';
import type { DocumentProcessingJobPayload } from '../ports/document-processing-job.payload';
import { DocumentChunkingService } from './document-chunking.service';
import { DocumentTextExtractionService } from './document-text-extraction.service';
import { EmbeddingService } from './embedding.service';
import { RagConfigService } from './rag-config.service';

@Injectable()
export class DocumentProcessingService {
  private readonly logger = new Logger(DocumentProcessingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalKnowledgeStorageService,
    private readonly textExtraction: DocumentTextExtractionService,
    private readonly chunkingService: DocumentChunkingService,
    private readonly embeddingService: EmbeddingService,
    private readonly ragConfig: RagConfigService,
  ) {}

  async process(payload: DocumentProcessingJobPayload): Promise<void> {
    const document = await this.prisma.knowledgeDocument.findFirst({
      where: {
        id: payload.documentId,
        organizationId: payload.organizationId,
        projectId: payload.projectId,
        deletedAt: null,
      },
    });

    if (!document?.storageKey) {
      throw new Error('Knowledge document is missing or has no stored file.');
    }

    if (document.status === KnowledgeDocumentStatus.READY) {
      this.logger.log(`Document already ready documentId=${document.id} projectId=${payload.projectId}`);
      return;
    }

    await this.prisma.knowledgeDocument.update({
      where: { id: document.id },
      data: {
        status: KnowledgeDocumentStatus.PROCESSING,
        processingError: null,
        updatedBy: payload.actorUserId,
      },
    });

    try {
      const buffer = await this.storage.read(document.storageKey);
      const extracted = await this.textExtraction.extract(buffer, document.mimeType, document.originalFilename);
      const chunks = this.chunkingService.chunk(extracted.text);

      if (!chunks.length) {
        throw new Error('No searchable chunks were produced from the document.');
      }

      await this.prisma.documentChunk.deleteMany({ where: { documentId: document.id } });

      for (let index = 0; index < chunks.length; index += this.ragConfig.embeddingBatchSize) {
        const batch = chunks.slice(index, index + this.ragConfig.embeddingBatchSize);
        const embeddings = await this.embeddingService.embedTexts(batch.map((chunk) => chunk.content));

        for (let batchIndex = 0; batchIndex < batch.length; batchIndex += 1) {
          const chunk = batch[batchIndex];
          const embedding = embeddings[batchIndex];

          if (!chunk || !embedding) {
            throw new Error('Embedding generation returned an incomplete batch.');
          }

          const created = await this.prisma.documentChunk.create({
            data: {
              documentId: document.id,
              ordinal: chunk.chunkIndex,
              content: chunk.content,
              tokenCount: Math.ceil(chunk.content.length / 4),
              metadata: {
                ...chunk.metadata,
                ...extracted.metadata,
                embeddingProvider: this.ragConfig.embeddingProvider,
                embeddingModel: this.ragConfig.embeddingModel,
              },
              createdBy: payload.actorUserId,
              updatedBy: payload.actorUserId,
            },
          });

          await this.writeEmbedding(created.id, embedding);
        }
      }

      await this.prisma.knowledgeDocument.update({
        where: { id: document.id },
        data: {
          status: KnowledgeDocumentStatus.READY,
          processingError: null,
          metadata: {
            ...(document.metadata as Record<string, unknown>),
            ...extracted.metadata,
            chunkCount: chunks.length,
            processedAt: new Date().toISOString(),
          },
          updatedBy: payload.actorUserId,
        },
      });

      const existingSource = await this.prisma.researchSource.findFirst({
        where: {
          projectId: payload.projectId,
          sourceId: document.id,
          deletedAt: null,
        },
        select: { id: true },
      });

      const sourceData = {
        title: document.title,
        content: {
          text: extracted.text.slice(0, 5000),
          documentId: document.id,
          chunkCount: chunks.length,
        },
        metadata: {
          ingestionMode: 'document-processing',
          characterCount: extracted.text.length,
        },
        updatedBy: payload.actorUserId,
      };

      if (existingSource) {
        await this.prisma.researchSource.update({
          where: { id: existingSource.id },
          data: sourceData,
        });
      } else {
        await this.prisma.researchSource.create({
          data: {
            tenantId: payload.organizationId,
            organizationId: payload.organizationId,
            projectId: payload.projectId,
            type: ResearchSourceType.UPLOADED_DOCUMENT,
            sourceId: document.id,
            ...sourceData,
            createdBy: payload.actorUserId,
          },
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown document processing failure.';
      await this.prisma.knowledgeDocument.update({
        where: { id: document.id },
        data: {
          status: KnowledgeDocumentStatus.FAILED,
          processingError: message,
          updatedBy: payload.actorUserId,
        },
      });
      throw error;
    }
  }

  private async writeEmbedding(chunkId: string, embedding: number[]): Promise<void> {
    const vector = `[${embedding.join(',')}]`;
    await this.prisma.$executeRaw`
      UPDATE "DocumentChunk"
      SET embedding = ${vector}::vector
      WHERE id = ${chunkId}::uuid
    `;
  }
}
