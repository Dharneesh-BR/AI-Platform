import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { RequestWithAuth } from './request-with-auth.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    return Boolean(request.user);
  }
}
