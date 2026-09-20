import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLocalAuthToken, hasApiAuth } from './api-access';

afterEach(() => vi.unstubAllEnvs());

describe('API authentication availability', () => {
  it('accepts configured local authentication without a bearer token', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_AUTH_BYPASS_ENABLED', 'true');
    vi.stubEnv('NEXT_PUBLIC_AUTH_BYPASS_TOKEN', 'test-local-token');
    expect(hasApiAuth()).toBe(true);
    expect(getLocalAuthToken()).toBe('test-local-token');
  });

  it('never accepts local authentication in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_AUTH_BYPASS_ENABLED', 'true');
    vi.stubEnv('NEXT_PUBLIC_AUTH_BYPASS_TOKEN', 'test-local-token');
    expect(hasApiAuth()).toBe(false);
    expect(getLocalAuthToken()).toBeUndefined();
    expect(hasApiAuth({ accessToken: 'signed-session-token' })).toBe(true);
  });

  it('requires both the local flag and a token', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_AUTH_BYPASS_ENABLED', 'true');
    vi.stubEnv('NEXT_PUBLIC_AUTH_BYPASS_TOKEN', '');
    expect(hasApiAuth()).toBe(false);
    vi.stubEnv('NEXT_PUBLIC_AUTH_BYPASS_ENABLED', 'false');
    vi.stubEnv('NEXT_PUBLIC_AUTH_BYPASS_TOKEN', 'test-local-token');
    expect(hasApiAuth()).toBe(false);
  });
});
