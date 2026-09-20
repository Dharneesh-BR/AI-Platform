import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DocumentSourceType, KnowledgeDocumentStatus, ResearchSourceType } from '@prisma/client';
import { QUEUE_NAMES } from '../../../../common/queue/queue.constants';
import { QueueInfrastructureService } from '../../../../common/queue/queue-infrastructure.service';
import type { AuthenticatedUser } from '../../../../common/auth';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { DocumentProcessingJobPayload } from '../ports/document-processing-job.payload';
import { RagConfigService } from './rag-config.service';
import { LocalKnowledgeStorageService } from '../../infrastructure/storage/local-knowledge-storage.service';
import { DocumentProcessingService } from './document-processing.service';

export interface UploadKnowledgeDocumentInput {
  organizationId: string;
  projectId: string;
  actor: AuthenticatedUser;
  originalFilename: string;
  mimeType?: string;
  sizeBytes: number;
  buffer: Buffer;
}

@Injectable()
export class KnowledgeDocumentService {
  private readonly logger = new Logger(KnowledgeDocumentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueInfrastructureService: QueueInfrastructureService,
    private readonly storage: LocalKnowledgeStorageService,
    private readonly ragConfig: RagConfigService,
    private readonly documentProcessingService: DocumentProcessingService,
  ) {}

  async list(organizationId: string, projectId: string) {
    await this.ensureProject(organizationId, projectId);

    return this.prisma.knowledgeDocument.findMany({
      where: { organizationId, projectId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { chunks: true } } },
    });
  }

  async get(organizationId: string, projectId: string, documentId: string) {
    const document = await this.prisma.knowledgeDocument.findFirst({
      where: { id: documentId, organizationId, projectId, deletedAt: null },
      include: { _count: { select: { chunks: true } } },
    });

    if (!document) {
      throw new NotFoundException('Knowledge document not found.');
    }

    return document;
  }

  async upload(input: UploadKnowledgeDocumentInput) {
    await this.ensureProject(input.organizationId, input.projectId);
    this.validateUpload(input);

    const document = await this.prisma.knowledgeDocument.create({
      data: {
        organizationId: input.organizationId,
        projectId: input.projectId,
        sourceType: this.sourceTypeForMime(input.mimeType),
        title: input.originalFilename,
        originalFilename: input.originalFilename,
        status: KnowledgeDocumentStatus.UPLOADED,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        metadata: { uploadMode: 'multipart' },
        uploadedByUserId: input.actor.id,
        createdBy: input.actor.id,
        updatedBy: input.actor.id,
      },
    });

    const storageResult = await this.storage.save({
      organizationId: input.organizationId,
      projectId: input.projectId,
      documentId: document.id,
      originalFilename: input.originalFilename,
      buffer: input.buffer,
    });

    const updatedDocument = await this.prisma.knowledgeDocument.update({
      where: { id: document.id },
      data: {
        status: KnowledgeDocumentStatus.QUEUED,
        uri: storageResult.uri,
        storageKey: storageResult.storageKey,
        checksum: storageResult.checksum,
        updatedBy: input.actor.id,
      },
    });

    await this.enqueueProcessing({
      documentId: document.id,
      organizationId: input.organizationId,
      projectId: input.projectId,
      actorUserId: input.actor.id,
    });

    return updatedDocument;
  }

  async retry(organizationId: string, projectId: string, documentId: string, actor: AuthenticatedUser) {
    const document = await this.get(organizationId, projectId, documentId);

    if (!document.storageKey) {
      throw new BadRequestException('Document does not have a stored file to process.');
    }

    await this.prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: {
        status: KnowledgeDocumentStatus.QUEUED,
        processingError: null,
        updatedBy: actor.id,
      },
    });

    await this.enqueueProcessing({ documentId, organizationId, projectId, actorUserId: actor.id });
    return this.get(organizationId, projectId, documentId);
  }

  async archive(organizationId: string, projectId: string, documentId: string, actor: AuthenticatedUser) {
    await this.get(organizationId, projectId, documentId);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.documentChunk.updateMany({
        where: { documentId, deletedAt: null },
        data: { deletedAt: now, updatedBy: actor.id },
      }),
      this.prisma.researchSource.updateMany({
        where: { projectId, sourceId: documentId, deletedAt: null },
        data: { deletedAt: now, updatedBy: actor.id },
      }),
      this.prisma.knowledgeDocument.update({
        where: { id: documentId },
        data: {
          status: KnowledgeDocumentStatus.ARCHIVED,
          deletedAt: now,
          updatedBy: actor.id,
        },
      }),
    ]);

    return { archived: true };
  }

  async createManualSource(input: {
    organizationId: string;
    projectId: string;
    actor: AuthenticatedUser;
    title: string;
    content: string;
    type?: ResearchSourceType;
    sourceId?: string;
    metadata?: Record<string, unknown>;
  }) {
    await this.ensureProject(input.organizationId, input.projectId);

    const document = await this.prisma.knowledgeDocument.create({
      data: {
        organizationId: input.organizationId,
        projectId: input.projectId,
        sourceType: DocumentSourceType.TEXT,
        title: input.title,
        originalFilename: `${input.title}.txt`,
        status: KnowledgeDocumentStatus.QUEUED,
        mimeType: 'text/plain',
        sizeBytes: Buffer.byteLength(input.content),
        metadata: {
          ...(input.metadata ?? {}),
          uploadMode: 'manual-text',
        },
        uploadedByUserId: input.actor.id,
        createdBy: input.actor.id,
        updatedBy: input.actor.id,
      },
    });

    const storageResult = await this.storage.save({
      organizationId: input.organizationId,
      projectId: input.projectId,
      documentId: document.id,
      originalFilename: `${input.title}.txt`,
      buffer: Buffer.from(input.content, 'utf8'),
    });

    await this.prisma.knowledgeDocument.update({
      where: { id: document.id },
      data: {
        uri: storageResult.uri,
        storageKey: storageResult.storageKey,
        checksum: storageResult.checksum,
      },
    });

    const source = await this.prisma.researchSource.create({
      data: {
        tenantId: input.organizationId,
        organizationId: input.organizationId,
        projectId: input.projectId,
        type: input.type ?? ResearchSourceType.UPLOADED_DOCUMENT,
        sourceId: document.id,
        title: input.title,
        content: {
          text: input.content,
          ingestedAt: new Date().toISOString(),
        },
        metadata: {
          ...(input.metadata ?? {}),
          ingestionMode: 'manual-text',
          characterCount: input.content.length,
        },
        createdBy: input.actor.id,
        updatedBy: input.actor.id,
      },
    });

    await this.enqueueProcessing({
      documentId: document.id,
      organizationId: input.organizationId,
      projectId: input.projectId,
      actorUserId: input.actor.id,
    });

    return source;
  }

  private validateUpload(input: UploadKnowledgeDocumentInput) {
    if (!input.buffer.length) {
      throw new BadRequestException('Uploaded file is empty.');
    }

    if (input.sizeBytes > this.ragConfig.maxUploadBytes) {
      throw new BadRequestException('Uploaded file exceeds the configured size limit.');
    }

    if (!this.isSupportedUpload(input.originalFilename, input.mimeType)) {
      throw new BadRequestException('Unsupported file type. TXT, Markdown, PDF, and DOCX uploads are supported in this build.');
    }
  }

  private sourceTypeForMime(mimeType?: string): DocumentSourceType {
    if (mimeType?.includes('markdown') || mimeType?.startsWith('text/')) {
      return DocumentSourceType.TEXT;
    }

    return DocumentSourceType.TEXT;
  }

  private isSupportedUpload(originalFilename: string, mimeType?: string): boolean {
    const normalizedMimeType = mimeType?.toLowerCase() ?? '';
    const normalizedFilename = originalFilename.toLowerCase();

    return (
      normalizedMimeType.startsWith('text/') ||
      normalizedMimeType.includes('markdown') ||
      normalizedFilename.endsWith('.txt') ||
      normalizedFilename.endsWith('.md') ||
      normalizedFilename.endsWith('.markdown') ||
      normalizedMimeType === 'application/pdf' ||
      normalizedFilename.endsWith('.pdf') ||
      normalizedMimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      normalizedFilename.endsWith('.docx')
    );
  }

  private async enqueueProcessing(payload: DocumentProcessingJobPayload): Promise<void> {
    if (process.env.DOCUMENT_WORKER_ENABLED === 'false') {
      await this.documentProcessingService.process(payload);
      return;
    }

    try {
      const queue = this.queueInfrastructureService.getQueue<DocumentProcessingJobPayload>(QUEUE_NAMES.documentProcessing);
      await queue.add('process-document', payload, this.queueInfrastructureService.getJobOptions(payload.documentId));
    } catch (error) {
      this.logger.warn(
        `Document queue unavailable; processing inline. documentId=${payload.documentId} reason=${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      await this.documentProcessingService.process(payload);
    }
  }

  private async ensureProject(organizationId: string, projectId: string): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId, deletedAt: null },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }
  }
}
