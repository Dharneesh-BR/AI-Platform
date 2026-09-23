import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AgentRuntimeConfigService {
  constructor(private readonly configService: ConfigService) {}

  get maxAgentSteps(): number {
    return this.positiveNumber('MAX_AGENT_STEPS', 8);
  }

  get maxPlannerSteps(): number {
    return this.positiveNumber('MAX_PLANNER_STEPS', 5);
  }

  get maxVerificationRetries(): number {
    return this.positiveNumber('MAX_VERIFICATION_RETRIES', 1);
  }

  get maxContextChunks(): number {
    return this.positiveNumber('MAX_CONTEXT_CHUNKS', 6);
  }

  get maxOutputTokens(): number {
    return this.positiveNumber('MAX_OUTPUT_TOKENS', 2400);
  }

  get maxSpecialistConcurrency(): number {
    return this.positiveNumber('MAX_SPECIALIST_CONCURRENCY', 2);
  }

  private positiveNumber(key: string, fallback: number): number {
    const configured = Number(this.configService.get<string>(key) ?? fallback);
    return Number.isFinite(configured) && configured > 0 ? configured : fallback;
  }
}
