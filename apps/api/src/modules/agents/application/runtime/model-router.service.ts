import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AgentCapability, AgentComplexity, BusinessAgentProfileView } from './agent-runtime.types';

export interface ModelRouteDecision {
  model: string;
  fallbackModels: string[];
  reason: string;
  policy: string;
}

@Injectable()
export class ModelRouterService {
  constructor(private readonly configService: ConfigService) {}

  select(input: {
    capability: AgentCapability | 'supervisor' | 'planner' | 'verification' | 'synthesis';
    complexity: AgentComplexity;
    businessAgent: BusinessAgentProfileView;
  }): ModelRouteDecision {
    const policy = this.policyFor(input.capability, input.complexity, input.businessAgent);
    const model = this.modelForPolicy(policy);
    const fallbackModels = this.fallbacksForPolicy(policy).filter((fallback) => fallback !== model);

    return {
      model,
      fallbackModels,
      reason: `${policy} policy selected for ${input.capability}.`,
      policy,
    };
  }

  private policyFor(
    capability: AgentCapability | 'supervisor' | 'planner' | 'verification' | 'synthesis',
    complexity: AgentComplexity,
    businessAgent: BusinessAgentProfileView,
  ): string {
    if (capability === 'verification' || businessAgent.slug === 'legal') {
      return 'VERIFICATION';
    }
    if (capability === 'writing' || capability === 'synthesis') {
      return 'WRITING';
    }
    if (capability === 'research') {
      return 'RESEARCH';
    }
    if (capability === 'calculation') {
      return 'REASONING';
    }
    if (complexity === 'complex') {
      return 'REASONING';
    }

    const configured = businessAgent.modelPolicy.defaultPolicy;
    return typeof configured === 'string' ? configured : 'GENERAL';
  }

  private modelForPolicy(policy: string): string {
    const configured = this.configService.get<string>(`MODEL_${policy}`)?.trim();
    const legacyConfigured = this.configService.get<string>(`MODEL_POLICY_${policy}`)?.trim();
    return configured ||
      legacyConfigured ||
      this.configService.get<string>('MODEL_DEFAULT')?.trim() ||
      this.configService.get<string>('LITELLM_DEFAULT_MODEL')?.trim() ||
      'magnafic-test';
  }

  private fallbacksForPolicy(policy: string): string[] {
    const configured =
      this.configService.get<string>(`MODEL_${policy}_FALLBACKS`)?.trim() ??
      this.configService.get<string>(`MODEL_${policy}_FALLBACK`)?.trim() ??
      this.configService.get<string>(`MODEL_POLICY_${policy}_FALLBACKS`)?.trim();
    const defaultModel =
      this.configService.get<string>('MODEL_DEFAULT')?.trim() ||
      this.configService.get<string>('LITELLM_DEFAULT_MODEL')?.trim() ||
      'magnafic-test';
    return configured ? configured.split(',').map((model) => model.trim()).filter(Boolean) : [defaultModel];
  }
}
