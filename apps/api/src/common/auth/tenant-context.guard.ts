import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MembershipStatus, PlatformRole as PrismaPlatformRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_ROUTE, REQUIRES_TENANT_CONTEXT } from './auth.metadata';
import { PlatformRole } from './platform-role.enum';
import type { RequestWithAuth } from './request-with-auth.interface';

@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const organizationId = request.headers['x-organization-id'];
    const requiresTenant = this.reflector.getAllAndOverride<boolean>(REQUIRES_TENANT_CONTEXT, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!request.user) {
      return true;
    }

    if (!organizationId) {
      if (requiresTenant) {
        throw new BadRequestException('X-Organization-Id is required for this operation.');
      }

      return true;
    }

    if (Array.isArray(organizationId)) {
      throw new BadRequestException('X-Organization-Id must be a single value.');
    }

    const role = await this.resolveMembershipRole(request, organizationId);

    request.tenantContext = {
      organizationId,
      user: request.user,
      role,
    };

    return true;
  }

  private async resolveMembershipRole(request: RequestWithAuth, organizationId: string): Promise<PlatformRole | undefined> {
    const user = request.user;
    if (!user) {
      return undefined;
    }

    if (user.roles.includes(PlatformRole.SuperAdmin)) {
      return PlatformRole.SuperAdmin;
    }

    if (user.isAuthBypass) {
      const configuredOrganizationId = process.env.AUTH_BYPASS_ORGANIZATION_ID;
      if (configuredOrganizationId && configuredOrganizationId !== organizationId) {
        throw new ForbiddenException('Local auth bypass is not allowed for this organization.');
      }
    }

    const membership = await this.prisma.organizationMembership.findFirst({
      where: {
        organizationId,
        userId: user.id,
        status: MembershipStatus.ACTIVE,
        deletedAt: null,
      },
      select: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this organization.');
    }

    return this.fromPrismaRole(membership.role);
  }

  private fromPrismaRole(role: PrismaPlatformRole): PlatformRole {
    const roleMap: Record<PrismaPlatformRole, PlatformRole> = {
      SUPER_ADMIN: PlatformRole.SuperAdmin,
      ADMIN: PlatformRole.Admin,
      CONSULTANT: PlatformRole.Consultant,
      CLIENT: PlatformRole.Client,
      VIEWER: PlatformRole.Viewer,
    };

    return roleMap[role];
  }
}
