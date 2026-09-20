import { Injectable } from '@nestjs/common';
import { LiteLlmGatewayService } from '../../../ai/application/services/litellm-gateway.service';
import { RagConfigService } from './rag-config.service';

@Injectable()
export class EmbeddingService {
  constructor(
    private readonly ragConfig: RagConfigService,
    private readonly liteLlmGateway: LiteLlmGatewayService,
  ) {}

  async embedTexts(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    if (this.ragConfig.embeddingProvider === 'litellm') {
      return this.liteLlmGateway.generateEmbeddings({
        model: this.ragConfig.embeddingModel,
        input: texts,
        dimensions: this.ragConfig.embeddingDimensions,
      });
    }

    return texts.map((text) => this.localHashEmbedding(text));
  }

  async embedQuery(query: string): Promise<number[]> {
    const [embedding] = await this.embedTexts([query]);
    if (!embedding) {
      throw new Error('Embedding provider returned no query embedding.');
    }
    return embedding;
  }

  private localHashEmbedding(text: string): number[] {
    const vector = Array.from({ length: this.ragConfig.embeddingDimensions }, () => 0);
    const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];

    for (const token of tokens) {
      let hash = 2166136261;
      for (let index = 0; index < token.length; index += 1) {
        hash ^= token.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      const position = Math.abs(hash) % vector.length;
      vector[position] = (vector[position] ?? 0) + 1;
    }

    const magnitude = Math.sqrt(vector.reduce((total, value) => total + value * value, 0)) || 1;
    return vector.map((value) => Number((value / magnitude).toFixed(6)));
  }
}
