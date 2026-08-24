import { SetMetadata } from '@nestjs/common';
import type { PlatformRole } from './platform-role.enum';

export const IS_PUBLIC_ROUTE = Symbol('IS_PUBLIC_ROUTE');
export const REQUIRED_ROLES = Symbol('REQUIRED_ROLES');
export const REQUIRES_TENANT_CONTEXT = Symbol('REQUIRES_TENANT_CONTEXT');

export const Public = () => SetMetadata(IS_PUBLIC_ROUTE, true);
export const Roles = (...roles: PlatformRole[]) => SetMetadata(REQUIRED_ROLES, roles);
export const RequireTenant = () => SetMetadata(REQUIRES_TENANT_CONTEXT, true);
