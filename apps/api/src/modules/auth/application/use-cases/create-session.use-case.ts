import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/auth';
import {
  IDENTITY_PROVIDER,
  type IdentityProvider,
} from '../ports/identity-provider.port';
import {
  PLATFORM_TOKEN_SERVICE,
  type PlatformTokenService,
} from '../ports/platform-token.port';
import {
  USER_SESSION_REPOSITORY,
  type UserSessionRepository,
} from '../ports/user-session.repository';

export interface CreateSessionCommand {
  firebaseIdToken: string;
}

export interface CreateSessionResult {
  accessToken: string;
  tokenType: 'Bearer';
  user: AuthenticatedUser;
}

@Injectable()
export class CreateSessionUseCase {
  constructor(
    @Inject(IDENTITY_PROVIDER)
    private readonly identityProvider: IdentityProvider,
    @Inject(USER_SESSION_REPOSITORY)
    private readonly userSessionRepository: UserSessionRepository,
    @Inject(PLATFORM_TOKEN_SERVICE)
    private readonly tokenService: PlatformTokenService,
  ) {}

  async execute(command: CreateSessionCommand): Promise<CreateSessionResult> {
    const identity = await this.identityProvider.verifyIdToken(command.firebaseIdToken);
    const user = await this.userSessionRepository.findOrCreateFromIdentity(identity);
    const accessToken = await this.tokenService.issueAccessToken(user);

    return {
      accessToken,
      tokenType: 'Bearer',
      user,
    };
  }
}

