import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_ROUTE } from './auth.metadata';
import { PlatformRole } from './platform-role.enum';
import type { AuthenticatedUser } from './authenticated-user.interface';
import type { RequestWithAuth } from './request-with-auth.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {
    if (process.env.NODE_ENV === 'production' && process.env.AUTH_BYPASS_ENABLED === 'true') {
      throw new Error('AUTH_BYPASS_ENABLED cannot be true in production.');
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const token = this.extractBearerToken(request.headers.authorization);

    if (!token) {
      if (this.canUseLocalAuthBypass(request)) {
        request.user = {
          id: '00000000-0000-0000-0000-000000000001',
          firebaseUid: 'local-auth-bypass',
          email: 'local-tester@magnafic.ai',
          displayName: 'Local Tester',
          roles: [PlatformRole.SuperAdmin],
          isAuthBypass: true,
        };
        return true;
      }

      throw new UnauthorizedException('Missing bearer token.');
    }

    try {
      request.user = await this.jwtService.verifyAsync<AuthenticatedUser>(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired bearer token.');
    }
  }

  private extractBearerToken(authorizationHeader: string | undefined): string | null {
    if (!authorizationHeader) {
      return null;
    }

    const [scheme, token] = authorizationHeader.split(' ');
    return scheme === 'Bearer' && token ? token : null;
  }

  private canUseLocalAuthBypass(request: RequestWithAuth): boolean {
    return (
      process.env.NODE_ENV !== 'production' &&
      process.env.AUTH_BYPASS_ENABLED === 'true' &&
      request.headers['x-magnafic-auth-bypass'] === process.env.AUTH_BYPASS_TOKEN
    );
  }
}
