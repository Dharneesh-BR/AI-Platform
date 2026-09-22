import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { RolesGuard } from './roles.guard';

function contextWithRequest(request: unknown): ExecutionContext {
  return {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows authenticated users', () => {
    const guard = new RolesGuard();

    expect(
      guard.canActivate(
        contextWithRequest({
          user: { id: 'user-1' },
        }),
      ),
    ).toBe(true);
  });

  it('allows auth bypass users', () => {
    const guard = new RolesGuard();

    expect(
      guard.canActivate(
        contextWithRequest({
          user: { id: '00000000-0000-0000-0000-000000000001', isAuthBypass: true },
        }),
      ),
    ).toBe(true);
  });

  it('denies missing authenticated user context', () => {
    const guard = new RolesGuard();

    expect(guard.canActivate(contextWithRequest({}))).toBe(false);
  });
});
