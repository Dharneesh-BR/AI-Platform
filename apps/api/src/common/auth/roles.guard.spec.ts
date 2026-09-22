import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PlatformRole } from './platform-role.enum';
import { RolesGuard } from './roles.guard';

function contextWithRequest(request: unknown): ExecutionContext {
  return {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows a required role from the authenticated user', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([PlatformRole.Admin]),
    };
    const guard = new RolesGuard(reflector as never);

    expect(
      guard.canActivate(
        contextWithRequest({
          user: { roles: [PlatformRole.Admin] },
        }),
      ),
    ).toBe(true);
  });

  it('keeps platform super admin authoritative', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([PlatformRole.Admin]),
    };
    const guard = new RolesGuard(reflector as never);

    expect(
      guard.canActivate(
        contextWithRequest({
          user: { roles: [PlatformRole.SuperAdmin] },
        }),
      ),
    ).toBe(true);
  });

  it('denies when user roles do not match', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([PlatformRole.Admin]),
    };
    const guard = new RolesGuard(reflector as never);

    expect(() =>
      guard.canActivate(
        contextWithRequest({
          user: { roles: [PlatformRole.Viewer] },
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});
