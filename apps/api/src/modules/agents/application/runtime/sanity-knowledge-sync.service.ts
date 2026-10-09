import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../../../../common/auth';
import { KnowledgeDocumentService } from '../../../knowledge-base/application/services/knowledge-document.service';
import type { SanityKnowledgeSourceView } from './agent-runtime.types';
import { SanityAgentProfileClient } from './sanity-agent-profile.client';

@Injectable()
export class SanityKnowledgeSyncService {
  private readonly logger = new Logger(SanityKnowledgeSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sanityClient: SanityAgentProfileClient,
    private readonly knowledgeDocumentService: KnowledgeDocumentService,
  ) {}

  async syncProject(input: { projectId: string; actor: AuthenticatedUser }) {
    const sources = await this.sanityClient.listKnowledgeSources();
    const existing = await this.prisma.knowledgeDocument.findMany({
      where: {
        projectId: input.projectId,
        deletedAt: null,
      },
      select: {
        id: true,
        metadata: true,
      },
    });
    const existingSourceIds = new Set(
      existing
        .map((document) => this.metadataString(document.metadata, 'sanitySourceId'))
        .filter((sourceId): sourceId is string => Boolean(sourceId)),
    );

    const results: Array<{
      sourceId: string;
      title: string;
      status: 'synced' | 'skipped' | 'failed';
      documentId?: string;
      reason?: string;
    }> = [];

    for (const source of sources) {
      if (existingSourceIds.has(source.sourceId)) {
        results.push({
          sourceId: source.sourceId,
          title: source.title,
          status: 'skipped',
          reason: 'Already synced.',
        });
        continue;
      }

      try {
        const document = await this.syncSource(source, input.projectId, input.actor);
        results.push({
          sourceId: source.sourceId,
          title: source.title,
          status: 'synced',
          documentId: document.id,
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown sync failure.';
        this.logger.warn(`Sanity knowledge sync failed: sourceId=${source.sourceId}, reason=${reason}`);
        results.push({
          sourceId: source.sourceId,
          title: source.title,
          status: 'failed',
          reason,
        });
      }
    }

    return {
      total: sources.length,
      synced: results.filter((result) => result.status === 'synced').length,
      skipped: results.filter((result) => result.status === 'skipped').length,
      failed: results.filter((result) => result.status === 'failed').length,
      results,
    };
  }

  private async syncSource(source: SanityKnowledgeSourceView, projectId: string, actor: AuthenticatedUser) {
    const response = await fetch(source.fileUrl);
    if (!response.ok) {
      throw new Error(`Sanity file download failed: ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const originalFilename = this.originalFilename(source);

    return this.knowledgeDocumentService.upload({
      projectId,
      actor,
      originalFilename,
      mimeType: source.mimeType ?? this.mimeTypeForFilename(originalFilename),
      sizeBytes: source.size ?? buffer.length,
      buffer,
      metadata: {
        uploadMode: 'sanity-sync',
        source: 'sanity',
        sanitySourceId: source.sourceId,
        sanityAssetId: source.assetId,
        knowledgeScope: source.scope,
        ownerType: source.ownerType,
        teamSlug: source.teamSlug,
        agentSlug: source.agentSlug,
        notes: source.notes,
      },
    });
  }

  private originalFilename(source: SanityKnowledgeSourceView): string {
    const filename = source.originalFilename?.trim();
    if (filename) {
      return filename;
    }

    return `${source.title.trim().replace(/[^a-zA-Z0-9._-]/g, '_')}.txt`;
  }

  private mimeTypeForFilename(filename: string): string {
    const normalized = filename.toLowerCase();
    if (normalized.endsWith('.pdf')) {
      return 'application/pdf';
    }
    if (normalized.endsWith('.docx')) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    if (normalized.endsWith('.md') || normalized.endsWith('.markdown')) {
      return 'text/markdown';
    }
    return 'text/plain';
  }

  private metadataString(metadata: unknown, key: string): string | null {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return null;
    }

    const value = (metadata as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : null;
  }
}
