import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthenticatedUser } from '../../../../common/auth';
import type { PlatformTokenService } from '../../application/ports/platform-token.port';

@Injectable()
export class JwtPlatformTokenService implements PlatformTokenService {
  constructor(private readonly jwtService: JwtService) {}

  issueAccessToken(user: AuthenticatedUser): Promise<string> {
    return this.jwtService.signAsync({
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      displayName: user.displayName,
      roles: user.roles,
    });
  }
}

