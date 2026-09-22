import { Injectable } from '@nestjs/common';
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
    const embedding = await this.embeddingService.embedQuery(input.query);
    return this.searchByEmbedding({
      projectId: input.projectId,
      userId: input.userId,
      embedding,
      limit: input.limit,
      documentId: input.documentId,
      allowedKnowledgeScopes: input.allowedKnowledgeScopes,
    });
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
        AND d.status = 'READY'
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
}
