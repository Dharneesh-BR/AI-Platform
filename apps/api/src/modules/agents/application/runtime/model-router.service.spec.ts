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
});
