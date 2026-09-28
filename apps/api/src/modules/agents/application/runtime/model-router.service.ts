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
    const model = this.modelForPolicy(policy, input.capability, input.businessAgent);
    const fallbackModels = this.fallbacksForPolicy(policy, input.businessAgent).filter((fallback) => fallback !== model);

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
    const override = this.capabilityOverrideFor(businessAgent, capability);
    if (typeof override?.policy === 'string' && override.policy.trim()) {
      return override.policy.trim().toUpperCase();
    }
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

  private modelForPolicy(
    policy: string,
    capability: AgentCapability | 'supervisor' | 'planner' | 'verification' | 'synthesis',
    businessAgent: BusinessAgentProfileView,
  ): string {
    const override = this.capabilityOverrideFor(businessAgent, capability);
    if (typeof override?.model === 'string' && override.model.trim()) {
      return override.model.trim();
    }
    const agentPreferredModel = this.firstConfiguredString(
      businessAgent.modelPolicy.preferredModel,
      businessAgent.modelPolicy.defaultModel,
      businessAgent.modelPolicy.model,
    );
    if (agentPreferredModel) {
      return agentPreferredModel;
    }

    const configured = this.configService.get<string>(`MODEL_${policy}`)?.trim();
    const legacyConfigured = this.configService.get<string>(`MODEL_POLICY_${policy}`)?.trim();
    return configured ||
      legacyConfigured ||
      this.configService.get<string>('MODEL_DEFAULT')?.trim() ||
      this.configService.get<string>('LITELLM_DEFAULT_MODEL')?.trim() ||
      'magnafic-test';
  }

  private fallbacksForPolicy(policy: string, businessAgent: BusinessAgentProfileView): string[] {
    const agentFallbacks = this.stringList(
      businessAgent.modelPolicy.fallbackModels ?? businessAgent.modelPolicy.fallbacks ?? businessAgent.modelPolicy.fallbackModel,
    );
    if (agentFallbacks.length) {
      return agentFallbacks;
    }

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

  private capabilityOverrideFor(
    businessAgent: BusinessAgentProfileView,
    capability: AgentCapability | 'supervisor' | 'planner' | 'verification' | 'synthesis',
  ): Record<string, unknown> | undefined {
    const overrides = businessAgent.modelPolicy.capabilityOverrides;
    if (!Array.isArray(overrides)) {
      return undefined;
    }

    return overrides.find((override): override is Record<string, unknown> =>
      Boolean(
        override &&
        typeof override === 'object' &&
        !Array.isArray(override) &&
        typeof override.capability === 'string' &&
        override.capability === capability,
      ),
    );
  }

  private firstConfiguredString(...values: unknown[]): string | undefined {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return undefined;
  }

  private stringList(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map((item) => item.trim());
    }
    if (typeof value === 'string' && value.trim()) {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
    return [];
  }
}
