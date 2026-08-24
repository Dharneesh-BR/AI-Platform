import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlatformRole, type AuthenticatedUser } from '../../../../common/auth';
import {
  PLATFORM_TOKEN_SERVICE,
  type PlatformTokenService,
} from '../ports/platform-token.port';
import type { CreateSessionResult } from './create-session.use-case';

export interface CreateDevSessionCommand {
  role: PlatformRole;
}

const demoUserByRole: Record<PlatformRole, Omit<AuthenticatedUser, 'roles'>> = {
  [PlatformRole.SuperAdmin]: {
    id: 'demo-super-admin',
    firebaseUid: 'demo-super-admin',
    email: 'super.admin@magnafic.ai',
    displayName: 'Super Admin',
  },
  [PlatformRole.Admin]: {
    id: 'demo-org-admin',
    firebaseUid: 'demo-org-admin',
    email: 'org.admin@client.com',
    displayName: 'Organization Admin',
  },
  [PlatformRole.Consultant]: {
    id: 'demo-consultant',
    firebaseUid: 'demo-consultant',
    email: 'consultant@magnafic.ai',
    displayName: 'Consultant',
  },
  [PlatformRole.Client]: {
    id: 'demo-client',
    firebaseUid: 'demo-client',
    email: 'client@client.com',
    displayName: 'Client',
  },
  [PlatformRole.Viewer]: {
    id: 'demo-viewer',
    firebaseUid: 'demo-viewer',
    email: 'viewer@client.com',
    displayName: 'Viewer',
  },
};

@Injectable()
export class CreateDevSessionUseCase {
  constructor(
    private readonly configService: ConfigService,
    @Inject(PLATFORM_TOKEN_SERVICE)
    private readonly tokenService: PlatformTokenService,
  ) {}

  async execute(command: CreateDevSessionCommand): Promise<CreateSessionResult> {
    if (this.configService.get<string>('ENABLE_DEV_AUTH') !== 'true') {
      throw new ForbiddenException('Development auth is disabled.');
    }

    const user: AuthenticatedUser = {
      ...demoUserByRole[command.role],
      roles: [command.role],
    };

    return {
      accessToken: await this.tokenService.issueAccessToken(user),
      tokenType: 'Bearer',
      user,
    };
  }
}
