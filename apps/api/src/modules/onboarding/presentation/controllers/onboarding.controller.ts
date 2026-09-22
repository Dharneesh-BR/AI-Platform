import { Controller, Headers, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../../common/auth';
import { CompleteOnboardingUseCase } from '../../application/use-cases/complete-onboarding.use-case';
import { StartOnboardingUseCase } from '../../application/use-cases/start-onboarding.use-case';

@ApiBearerAuth()
@ApiTags('Project Onboarding')
@Controller('projects/:projectId/onboarding')
export class OnboardingController {
  constructor(
    private readonly startOnboardingUseCase: StartOnboardingUseCase,
    private readonly completeOnboardingUseCase: CompleteOnboardingUseCase,
  ) {}

  @Post('start')
  start(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.startOnboardingUseCase.execute(projectId, user);
  }

  @Post('complete')
  complete(
    @Param('projectId') projectId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.completeOnboardingUseCase.execute(
      projectId,
      user,
      idempotencyKey,
    );
  }
}
