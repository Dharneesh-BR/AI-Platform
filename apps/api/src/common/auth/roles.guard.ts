import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_ROLES } from './auth.metadata';
import { PlatformRole } from './platform-role.enum';
import type { RequestWithAuth } from './request-with-auth.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<PlatformRole[]>(REQUIRED_ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const userRoles = [
      ...(request.user?.roles ?? []),
      ...(request.tenantContext?.role ? [request.tenantContext.role] : []),
    ];

    if (userRoles.includes(PlatformRole.SuperAdmin)) {
      return true;
    }

    const hasRole = requiredRoles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('Insufficient role for this operation.');
    }

    return true;
  }
}
