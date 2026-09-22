import { Injectable } from '@nestjs/common';
import { RagConfigService } from './rag-config.service';
import { VectorSearchService, type KnowledgeSearchResult } from './vector-search.service';

export interface RagContext {
  contextText: string;
  sources: Array<{
    documentId: string;
    documentName: string;
    chunkId: string;
    pageNumber: number | null;
    similarity: number;
  }>;
}

@Injectable()
export class RagContextService {
  constructor(
    private readonly vectorSearchService: VectorSearchService,
    private readonly ragConfig: RagConfigService,
  ) {}

  async buildContext(input: {
    projectId: string;
    userId: string;
    question: string;
    allowedKnowledgeScopes?: string[];
  }): Promise<RagContext> {
    const results = await this.vectorSearchService.search({
      projectId: input.projectId,
      userId: input.userId,
      query: input.question,
      limit: this.ragConfig.maxRetrievedChunks,
      allowedKnowledgeScopes: input.allowedKnowledgeScopes,
    });

    return this.toContext(results);
  }

  private toContext(results: KnowledgeSearchResult[]): RagContext {
    let remainingCharacters = this.ragConfig.maxContextCharacters;
    const contextBlocks: string[] = [];
    const sources: RagContext['sources'] = [];

    for (const result of results) {
      if (remainingCharacters <= 0) {
        break;
      }

      const content = result.content.slice(0, remainingCharacters);
      remainingCharacters -= content.length;
      contextBlocks.push(
        [
          `Source: ${result.documentName}`,
          result.pageNumber ? `Page: ${result.pageNumber}` : null,
          `Similarity: ${result.similarity.toFixed(4)}`,
          `Content: ${content}`,
        ].filter(Boolean).join('\n'),
      );
      sources.push({
        documentId: result.documentId,
        documentName: result.documentName,
        chunkId: result.chunkId,
        pageNumber: result.pageNumber,
        similarity: result.similarity,
      });
    }

    return {
      contextText: contextBlocks.join('\n\n---\n\n'),
      sources,
    };
  }
}
