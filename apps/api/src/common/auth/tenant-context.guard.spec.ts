import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PlatformRole } from './platform-role.enum';
import { TenantContextGuard } from './tenant-context.guard';

function contextWithRequest(request: unknown): ExecutionContext {
  return {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('TenantContextGuard', () => {
  it('rejects tenant routes without an organization header', async () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true),
    };
    const prisma = { organizationMembership: { findFirst: vi.fn() } };
    const guard = new TenantContextGuard(reflector as never, prisma as never);

    await expect(
      guard.canActivate(
        contextWithRequest({
          headers: {},
          user: { id: 'user-1', roles: [PlatformRole.Client] },
        }),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('attaches tenant context for active organization membership', async () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true),
    };
    const prisma = {
      organizationMembership: {
        findFirst: vi.fn().mockResolvedValue({ role: 'ADMIN' }),
      },
    };
    const guard = new TenantContextGuard(reflector as never, prisma as never);
    const request = {
      headers: { 'x-organization-id': 'org-1' },
      user: { id: 'user-1', roles: [PlatformRole.Client] },
    };

    await expect(guard.canActivate(contextWithRequest(request))).resolves.toBe(true);
    expect(prisma.organizationMembership.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 'org-1',
          userId: 'user-1',
          status: 'ACTIVE',
        }),
      }),
    );
    expect(request).toMatchObject({
      tenantContext: {
        organizationId: 'org-1',
        role: PlatformRole.Admin,
      },
    });
  });

  it('denies users without active organization membership', async () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true),
    };
    const prisma = {
      organizationMembership: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    const guard = new TenantContextGuard(reflector as never, prisma as never);

    await expect(
      guard.canActivate(
        contextWithRequest({
          headers: { 'x-organization-id': 'org-2' },
          user: { id: 'user-1', roles: [PlatformRole.Client] },
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
