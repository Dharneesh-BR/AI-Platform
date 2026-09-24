import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { EmbeddingService } from './embedding.service';
import { RagConfigService } from './rag-config.service';

export interface KnowledgeSearchResult {
  chunkId: string;
  documentId: string;
  documentName: string;
  content: string;
  pageNumber: number | null;
  similarity: number;
  metadata: Record<string, unknown>;
}

@Injectable()
export class VectorSearchService {
  private readonly logger = new Logger(VectorSearchService.name);
  private knowledgeDocumentHasStatusColumn: boolean | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly ragConfig: RagConfigService,
  ) {}

  async search(input: {
    projectId: string;
    userId: string;
    query: string;
    limit?: number;
    documentId?: string;
    allowedKnowledgeScopes?: string[];
  }): Promise<KnowledgeSearchResult[]> {
    try {
      const embedding = await this.embeddingService.embedQuery(input.query);
      const results = await this.searchByEmbedding({
        projectId: input.projectId,
        userId: input.userId,
        embedding,
        limit: input.limit,
        documentId: input.documentId,
        allowedKnowledgeScopes: input.allowedKnowledgeScopes,
      });

      if (results.length) {
        return results;
      }
    } catch (error) {
      this.logger.warn(
        `Vector knowledge search unavailable; falling back to source text search. reason=${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return this.searchSourceText(input);
  }

  async searchByEmbedding(input: {
    projectId: string;
    userId: string;
    embedding: number[];
    limit?: number;
    documentId?: string;
    allowedKnowledgeScopes?: string[];
  }): Promise<KnowledgeSearchResult[]> {
    const vector = `[${input.embedding.join(',')}]`;
    const limit = Math.max(1, Math.min(input.limit ?? this.ragConfig.maxRetrievedChunks, 20));
    const documentFilter = input.documentId
      ? Prisma.sql`AND d.id = ${input.documentId}::uuid`
      : Prisma.empty;
    const allowedKnowledgeScopes = input.allowedKnowledgeScopes?.length ? input.allowedKnowledgeScopes : ['GENERAL'];
    const knowledgeScopeFilter = Prisma.sql`
      AND COALESCE(d.metadata->>'knowledgeScope', 'GENERAL') IN (${Prisma.join(allowedKnowledgeScopes)})
    `;
    const readyDocumentFilter = await this.getReadyDocumentFilter();

    const rows = await this.prisma.$queryRaw<
      Array<{
        chunkId: string;
        documentId: string;
        documentName: string;
        content: string;
        pageNumber: number | null;
        similarity: number;
        metadata: unknown;
      }>
    >`
      SELECT
        c.id::text AS "chunkId",
        d.id::text AS "documentId",
        d.title AS "documentName",
        c.content,
        NULLIF((c.metadata->>'pageNumber')::int, 0) AS "pageNumber",
        1 - (c.embedding <=> ${vector}::vector) AS similarity,
        c.metadata
      FROM "DocumentChunk" c
      INNER JOIN "KnowledgeDocument" d ON d.id = c."documentId"
      INNER JOIN "Project" p ON p.id = d."projectId"
      WHERE d."projectId" = ${input.projectId}::uuid
        AND p."createdBy" = ${input.userId}::uuid
        AND p."deletedAt" IS NULL
        AND d."deletedAt" IS NULL
        AND c."deletedAt" IS NULL
        AND c.embedding IS NOT NULL
        ${readyDocumentFilter}
        ${knowledgeScopeFilter}
        ${documentFilter}
      ORDER BY c.embedding <=> ${vector}::vector
      LIMIT ${limit}
    `;

    return rows
      .filter((row) => row.similarity >= this.ragConfig.minimumSimilarity)
      .map((row) => ({
        chunkId: row.chunkId,
        documentId: row.documentId,
        documentName: row.documentName,
        content: row.content,
        pageNumber: row.pageNumber,
        similarity: Number(row.similarity),
        metadata: row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata) ? row.metadata as Record<string, unknown> : {},
      }));
  }

  private async getReadyDocumentFilter(): Promise<Prisma.Sql> {
    if (this.knowledgeDocumentHasStatusColumn === undefined) {
      const rows = await this.prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'KnowledgeDocument'
            AND column_name = 'status'
        ) AS "exists"
      `;
      this.knowledgeDocumentHasStatusColumn = Boolean(rows[0]?.exists);
      if (!this.knowledgeDocumentHasStatusColumn) {
        this.logger.warn('KnowledgeDocument.status column is missing; vector search will use embedded chunks without document status filtering.');
      }
    }

    return this.knowledgeDocumentHasStatusColumn
      ? Prisma.sql`AND d.status = 'READY'`
      : Prisma.empty;
  }

  private async searchSourceText(input: {
    projectId: string;
    userId: string;
    query: string;
    limit?: number;
    documentId?: string;
  }): Promise<KnowledgeSearchResult[]> {
    const limit = Math.max(1, Math.min(input.limit ?? this.ragConfig.maxRetrievedChunks, 20));
    const sources = await this.prisma.researchSource.findMany({
      where: {
        projectId: input.projectId,
        deletedAt: null,
        project: {
          createdBy: input.userId,
          deletedAt: null,
        },
        ...(input.documentId
          ? {
              OR: [
                { id: input.documentId },
                { sourceId: input.documentId },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return sources
      .map((source) => {
        const content = this.extractContentText(source.content);
        return {
          source,
          content,
          score: this.lexicalScore(input.query, `${source.title}\n${content}`),
        };
      })
      .filter((result) => result.content.trim() && result.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit)
      .map((result) => ({
        chunkId: result.source.id,
        documentId: result.source.sourceId ?? result.source.id,
        documentName: result.source.title,
        content: result.content.slice(0, this.ragConfig.maxContextCharacters),
        pageNumber: null,
        similarity: Math.min(0.99, result.score),
        metadata: {
          ...this.asRecord(result.source.metadata),
          fallback: 'research-source-text',
          sourceType: result.source.type,
        },
      }));
  }

  private extractContentText(content: unknown): string {
    if (typeof content === 'string') {
      return content;
    }

    if (content && typeof content === 'object' && !Array.isArray(content)) {
      const record = content as Record<string, unknown>;
      if (typeof record.text === 'string') {
        return record.text;
      }
      if (typeof record.summary === 'string') {
        return record.summary;
      }
    }

    return '';
  }

  private lexicalScore(query: string, text: string): number {
    const terms = this.uniqueTerms(query);

    if (!terms.length) {
      return 0;
    }

    const normalizedText = text.toLowerCase();
    const matchedTerms = terms.filter((term) => normalizedText.includes(term));
    return matchedTerms.length / terms.length;
  }

  private uniqueTerms(value: string): string[] {
    return [...new Set(
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/i)
        .map((term) => term.trim())
        .filter((term) => term.length >= 3),
    )];
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  }
}
