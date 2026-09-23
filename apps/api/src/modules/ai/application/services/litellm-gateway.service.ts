import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AiChatMessage,
  AiGenerateEmbeddingsInput,
  AiGenerateTextInput,
  AiGenerateTextResult,
  LiteLlmChatOptions,
  LlmChatResult,
} from '../types/ai-generation.types';

type LiteLlmAssistantContent = string | Array<{ type?: string; text?: string }>;

interface LiteLlmChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: LiteLlmAssistantContent;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  model?: string;
}

interface LiteLlmErrorResponse {
  error?: {
    message?: string;
    type?: string;
    code?: string | number;
  };
}

interface LiteLlmEmbeddingResponse {
  data?: Array<{
    embedding?: number[];
    index?: number;
  }>;
  model?: string;
}

class EmptyLiteLlmResponseError extends Error {
  constructor() {
    super('LiteLLM returned an empty response.');
    this.name = 'EmptyLiteLlmResponseError';
  }
}

@Injectable()
export class LiteLlmGatewayService {
  private readonly logger = new Logger(LiteLlmGatewayService.name);

  constructor(private readonly configService: ConfigService) {}

  async chat(message: string, options: LiteLlmChatOptions = {}): Promise<LlmChatResult> {
    const messages: AiChatMessage[] = [];

    if (options.systemPrompt?.trim()) {
      messages.push({ role: 'system', content: options.systemPrompt.trim() });
    }

    messages.push({ role: 'user', content: message });

    const result = await this.generateText({
      messages,
      model: options.model,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    });

    return {
      content: result.content,
      model: result.model,
      usage: {
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        totalTokens: result.totalTokens,
      },
    };
  }

  async generateText(input: AiGenerateTextInput): Promise<AiGenerateTextResult> {
    const baseUrl = this.configService.get<string>('LITELLM_BASE_URL')?.trim();
    const apiKey = this.configService.get<string>('LITELLM_API_KEY')?.trim();
    const model = input.model?.trim() || this.defaultModel;

    if (!baseUrl || !apiKey) {
      throw new ServiceUnavailableException('LiteLLM is not configured. Set LITELLM_BASE_URL and LITELLM_API_KEY.');
    }

    let lastRetryableError: unknown;

    for (let attempt = 1; attempt <= this.requestAttempts; attempt += 1) {
      try {
        const response = await fetch(this.chatCompletionsUrl(baseUrl), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: input.messages,
            temperature: input.temperature ?? 0.3,
            max_tokens: input.maxTokens ?? 900,
            metadata: input.metadata,
          }),
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        if (!response.ok) {
          await this.handleFailedResponse(response, model);
        }

        const completion = (await response.json()) as LiteLlmChatCompletionResponse;
        const choice = completion.choices?.[0];
        const content = this.extractAssistantContent(choice?.message?.content);

        if (!content) {
          this.logger.warn(`LiteLLM returned empty content: model=${model}, finishReason=${choice?.finish_reason ?? 'unknown'}, attempt=${attempt}`);
          throw new EmptyLiteLlmResponseError();
        }

        return {
          content,
          model: completion.model ?? model,
          provider: 'litellm',
          finishReason: choice?.finish_reason,
          promptTokens: completion.usage?.prompt_tokens,
          completionTokens: completion.usage?.completion_tokens,
          totalTokens: completion.usage?.total_tokens,
        };
      } catch (error) {
        if (error instanceof ServiceUnavailableException) {
          throw error;
        }

        lastRetryableError = error;
        const reason = error instanceof EmptyLiteLlmResponseError ? 'empty response' : this.requestFailureReason(error);

        if (attempt < this.requestAttempts) {
          this.logger.warn(`Retrying LiteLLM request: model=${model}, reason=${reason}, attempt=${attempt}, timeoutMs=${this.timeoutMs}`);
          continue;
        }

        this.logger.error(`LiteLLM request failed: model=${model}, reason=${reason}, timeoutMs=${this.timeoutMs}`);
      }
    }

    if (lastRetryableError instanceof EmptyLiteLlmResponseError) {
      throw new ServiceUnavailableException('LiteLLM returned an empty response.');
    }

    throw new ServiceUnavailableException(`LiteLLM ${this.requestFailureReason(lastRetryableError)}.`);
  }

  async generateEmbeddings(input: AiGenerateEmbeddingsInput): Promise<number[][]> {
    const baseUrl = this.configService.get<string>('LITELLM_BASE_URL')?.trim();
    const apiKey = this.configService.get<string>('LITELLM_API_KEY')?.trim();
    const model = input.model?.trim();

    if (!baseUrl || !apiKey || !model) {
      throw new ServiceUnavailableException('LiteLLM embeddings are not configured. Set LITELLM_BASE_URL, LITELLM_API_KEY, and EMBEDDING_MODEL.');
    }

    try {
      const response = await fetch(this.embeddingsUrl(baseUrl), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: input.input,
          dimensions: input.dimensions,
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        await this.handleFailedResponse(response, model);
      }

      const embeddingResponse = (await response.json()) as LiteLlmEmbeddingResponse;
      const embeddings = [...(embeddingResponse.data ?? [])]
        .sort((left, right) => (left.index ?? 0) - (right.index ?? 0))
        .map((item) => item.embedding)
        .filter((embedding): embedding is number[] => Array.isArray(embedding));

      if (embeddings.length !== input.input.length) {
        throw new ServiceUnavailableException('LiteLLM returned incomplete embeddings.');
      }

      return embeddings;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      const reason = this.requestFailureReason(error);
      this.logger.error(`LiteLLM embedding request failed: model=${model}, reason=${reason}, timeoutMs=${this.timeoutMs}`);
      throw new ServiceUnavailableException(`LiteLLM embedding ${reason}.`);
    }
  }

  private get defaultModel(): string {
    return (
      this.configService.get<string>('LITELLM_DEFAULT_MODEL')?.trim() ||
      this.configService.get<string>('LITELLM_MODEL')?.trim() ||
      'magnafic-test'
    );
  }

  private get timeoutMs(): number {
    const configured = Number(this.configService.get<string>('LITELLM_TIMEOUT_MS') ?? 60000);
    return Number.isFinite(configured) && configured > 0 ? configured : 60000;
  }

  private get requestAttempts(): number {
    const configured = Number(this.configService.get<string>('LITELLM_REQUEST_ATTEMPTS') ?? 2);
    return Number.isFinite(configured) && configured > 0 ? Math.min(Math.floor(configured), 4) : 2;
  }

  private extractAssistantContent(content: LiteLlmAssistantContent | undefined): string {
    if (typeof content === 'string') {
      return content.trim();
    }

    if (!Array.isArray(content)) {
      return '';
    }

    return content
      .map((part) => part.text)
      .filter((text): text is string => Boolean(text?.trim()))
      .join('\n')
      .trim();
  }

  private requestFailureReason(error: unknown): 'request timeout' | 'network failure' {
    return error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
      ? 'request timeout'
      : 'network failure';
  }

  private chatCompletionsUrl(baseUrl: string): string {
    const normalized = baseUrl.replace(/\/+$/, '');

    if (normalized.endsWith('/v1')) {
      return `${normalized}/chat/completions`;
    }

    return `${normalized}/v1/chat/completions`;
  }

  private embeddingsUrl(baseUrl: string): string {
    const normalized = baseUrl.replace(/\/+$/, '');

    if (normalized.endsWith('/v1')) {
      return `${normalized}/embeddings`;
    }

    return `${normalized}/v1/embeddings`;
  }

  private async handleFailedResponse(response: Response, model: string): Promise<never> {
    const responseText = await response.text();
    const parsedError = this.parseErrorResponse(responseText);
    const errorType = parsedError.error?.type ?? parsedError.error?.code ?? 'unknown';
    const safeMessage = this.safeErrorMessage(response.status);

    this.logger.error(`LiteLLM request failed: model=${model}, status=${response.status}, type=${errorType}`);

    throw new ServiceUnavailableException(safeMessage);
  }

  private parseErrorResponse(responseText: string): LiteLlmErrorResponse {
    try {
      return JSON.parse(responseText) as LiteLlmErrorResponse;
    } catch {
      return {};
    }
  }

  private safeErrorMessage(status: number): string {
    if (status === 401 || status === 403) {
      return 'LiteLLM authentication failed.';
    }

    if (status === 404) {
      return 'LiteLLM model is not available.';
    }

    if (status === 402) {
      return 'LiteLLM provider billing is unavailable.';
    }

    if (status === 408 || status === 504) {
      return 'LiteLLM request timed out.';
    }

    if (status === 429) {
      return 'LiteLLM provider rate limit exceeded.';
    }

    return 'LiteLLM request failed.';
  }
}
