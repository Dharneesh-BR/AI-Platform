import { CanActivate, ExecutionContext, Injectable, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_ROUTE, REQUIRES_TENANT_CONTEXT } from './auth.metadata';
import type { RequestWithAuth } from './request-with-auth.interface';

@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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

    request.tenantContext = {
      organizationId,
      user: request.user,
    };

    return true;
  }
}
