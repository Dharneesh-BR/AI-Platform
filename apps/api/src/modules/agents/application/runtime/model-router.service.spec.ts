import { describe, expect, it } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import type { BusinessAgentProfileView } from './agent-runtime.types';
import { ModelRouterService } from './model-router.service';

const businessAgent: BusinessAgentProfileView = {
  name: 'Magnafic AI',
  slug: 'magnafic-ai',
  department: 'Strategy',
  systemInstructions: 'Advise safely.',
  capabilities: ['analysis', 'writing', 'research', 'calculation'],
  allowedSpecialists: [],
  allowedTools: [],
  knowledgeScopes: [],
  modelPolicy: {},
  verificationPolicy: {},
  enabled: true,
};

function router(env: Record<string, string>) {
  return new ModelRouterService({
    get: (key: string) => env[key],
  } as ConfigService);
}

describe('ModelRouterService', () => {
  it('selects policy-specific model aliases', () => {
    const service = router({ MODEL_WRITING: 'writer-model', MODEL_DEFAULT: 'default-model' });

    const result = service.select({ capability: 'writing', complexity: 'simple', businessAgent });

    expect(result.policy).toBe('WRITING');
    expect(result.model).toBe('writer-model');
  });

  it('uses configured fallbacks and removes duplicate primary model', () => {
    const service = router({
      MODEL_REASONING: 'reasoning-model',
      MODEL_REASONING_FALLBACK: 'reasoning-model,default-model',
      MODEL_DEFAULT: 'default-model',
    });

    const result = service.select({ capability: 'calculation', complexity: 'standard', businessAgent });

    expect(result.model).toBe('reasoning-model');
    expect(result.fallbackModels).toEqual(['default-model']);
  });

  it('falls back safely for unknown or unavailable policy aliases', () => {
    const service = router({ MODEL_DEFAULT: 'default-model' });

    const result = service.select({ capability: 'analysis', complexity: 'simple', businessAgent });

    expect(result.model).toBe('default-model');
  });

  it('uses agent preferred models before environment policy models', () => {
    const service = router({ MODEL_WRITING: 'writer-model', MODEL_DEFAULT: 'default-model' });

    const result = service.select({
      capability: 'writing',
      complexity: 'simple',
      businessAgent: {
        ...businessAgent,
        modelPolicy: {
          preferredModel: 'sanity-agent-model',
          fallbackModels: ['sanity-fallback-model'],
        },
      },
    });

    expect(result.policy).toBe('WRITING');
    expect(result.model).toBe('sanity-agent-model');
    expect(result.fallbackModels).toEqual(['sanity-fallback-model']);
  });

  it('uses capability overrides for specialist-specific models', () => {
    const service = router({ MODEL_RESEARCH: 'research-policy-model', MODEL_DEFAULT: 'default-model' });

    const result = service.select({
      capability: 'research',
      complexity: 'standard',
      businessAgent: {
        ...businessAgent,
        modelPolicy: {
          preferredModel: 'general-agent-model',
          capabilityOverrides: [
            {
              capability: 'research',
              policy: 'RESEARCH',
              model: 'sanity-research-model',
            },
          ],
        },
      },
    });

    expect(result.policy).toBe('RESEARCH');
    expect(result.model).toBe('sanity-research-model');
  });
});
