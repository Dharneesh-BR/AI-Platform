import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
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
  function guardWithPublicRoute(isPublic = false): RolesGuard {
    return new RolesGuard({
      getAllAndOverride: vi.fn(() => isPublic),
    } as unknown as Reflector);
  }

  it('allows authenticated users', () => {
    const guard = guardWithPublicRoute();

    expect(
      guard.canActivate(
        contextWithRequest({
          user: { id: 'user-1' },
        }),
      ),
    ).toBe(true);
  });

  it('allows auth bypass users', () => {
    const guard = guardWithPublicRoute();

    expect(
      guard.canActivate(
        contextWithRequest({
          user: { id: '00000000-0000-0000-0000-000000000001', isAuthBypass: true },
        }),
      ),
    ).toBe(true);
  });

  it('denies missing authenticated user context', () => {
    const guard = guardWithPublicRoute();

    expect(guard.canActivate(contextWithRequest({}))).toBe(false);
  });

  it('allows public routes before a user session exists', () => {
    const guard = guardWithPublicRoute(true);

    expect(guard.canActivate(contextWithRequest({}))).toBe(true);
  });
});
