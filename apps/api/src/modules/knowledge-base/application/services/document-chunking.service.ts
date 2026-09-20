import { Injectable } from '@nestjs/common';
import { RagConfigService } from './rag-config.service';

export interface DocumentChunkInput {
  content: string;
  chunkIndex: number;
  metadata: Record<string, unknown>;
}

@Injectable()
export class DocumentChunkingService {
  constructor(private readonly ragConfig: RagConfigService) {}

  chunk(text: string): DocumentChunkInput[] {
    const paragraphs = text
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
    const chunks: DocumentChunkInput[] = [];
    let current = '';

    for (const paragraph of paragraphs) {
      const candidate = current ? `${current}\n\n${paragraph}` : paragraph;

      if (candidate.length <= this.ragConfig.chunkSize) {
        current = candidate;
        continue;
      }

      if (current) {
        chunks.push(this.toChunk(current, chunks.length));
      }

      if (paragraph.length <= this.ragConfig.chunkSize) {
        current = this.withOverlap(current, paragraph);
      } else {
        for (const segment of this.splitLongParagraph(paragraph)) {
          chunks.push(this.toChunk(segment, chunks.length));
        }
        current = '';
      }
    }

    if (current) {
      chunks.push(this.toChunk(current, chunks.length));
    }

    return chunks;
  }

  private splitLongParagraph(paragraph: string): string[] {
    const chunks: string[] = [];
    const step = Math.max(1, this.ragConfig.chunkSize - this.ragConfig.chunkOverlap);

    for (let index = 0; index < paragraph.length; index += step) {
      chunks.push(paragraph.slice(index, index + this.ragConfig.chunkSize).trim());
    }

    return chunks.filter(Boolean);
  }

  private withOverlap(previous: string, next: string): string {
    if (!previous || this.ragConfig.chunkOverlap <= 0) {
      return next;
    }

    return `${previous.slice(-this.ragConfig.chunkOverlap)}\n\n${next}`;
  }

  private toChunk(content: string, chunkIndex: number): DocumentChunkInput {
    return {
      content,
      chunkIndex,
      metadata: {
        characterCount: content.length,
        chunkingStrategy: 'paragraph-aware-overlap',
      },
    };
  }
}
