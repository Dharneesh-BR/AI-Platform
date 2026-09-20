import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RagConfigService {
  constructor(private readonly configService: ConfigService) {}

  get chunkSize(): number {
    return this.positiveNumber('RAG_CHUNK_SIZE', 1200);
  }

  get chunkOverlap(): number {
    return Math.min(this.positiveNumber('RAG_CHUNK_OVERLAP', 160), this.chunkSize - 1);
  }

  get embeddingProvider(): 'local' | 'litellm' {
    return this.configService.get<string>('EMBEDDING_PROVIDER') === 'litellm' ? 'litellm' : 'local';
  }

  get embeddingModel(): string {
    return this.configService.get<string>('EMBEDDING_MODEL')?.trim() || 'local-hash-embedding';
  }

  get embeddingDimensions(): number {
    return this.positiveNumber('EMBEDDING_DIMENSIONS', 1536);
  }

  get embeddingBatchSize(): number {
    return this.positiveNumber('EMBEDDING_BATCH_SIZE', 16);
  }

  get maxRetrievedChunks(): number {
    return this.positiveNumber('RAG_MAX_RETRIEVED_CHUNKS', 6);
  }

  get maxContextCharacters(): number {
    return this.positiveNumber('RAG_MAX_CONTEXT_CHARACTERS', 6000);
  }

  get minimumSimilarity(): number {
    const value = Number(this.configService.get<string>('RAG_MIN_SIMILARITY') ?? 0);
    return Number.isFinite(value) ? value : 0;
  }

  get storageDirectory(): string {
    return this.configService.get<string>('KNOWLEDGE_STORAGE_DIR')?.trim() || 'storage/knowledge';
  }

  get maxUploadBytes(): number {
    return this.positiveNumber('KNOWLEDGE_MAX_UPLOAD_BYTES', 10 * 1024 * 1024);
  }

  private positiveNumber(key: string, fallback: number): number {
    const configured = Number(this.configService.get<string>(key) ?? fallback);
    return Number.isFinite(configured) && configured > 0 ? configured : fallback;
  }
}
