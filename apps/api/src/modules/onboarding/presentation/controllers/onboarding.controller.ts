import { Controller, Headers, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentTenant,
  CurrentUser,
  RequireTenant,
  type AuthenticatedUser,
  type RequestTenantContext,
} from '../../../../common/auth';
import { CompleteOnboardingUseCase } from '../../application/use-cases/complete-onboarding.use-case';
import { StartOnboardingUseCase } from '../../application/use-cases/start-onboarding.use-case';

@ApiBearerAuth()
@ApiTags('Project Onboarding')
@RequireTenant()
@Controller('projects/:projectId/onboarding')
export class OnboardingController {
  constructor(
    private readonly startOnboardingUseCase: StartOnboardingUseCase,
    private readonly completeOnboardingUseCase: CompleteOnboardingUseCase,
  ) {}

  @Post('start')
  start(
    @Param('projectId') projectId: string,
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.startOnboardingUseCase.execute(tenant.organizationId, projectId, user);
  }

  @Post('complete')
  complete(
    @Param('projectId') projectId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.completeOnboardingUseCase.execute(
      tenant.organizationId,
      projectId,
      user,
      idempotencyKey,
    );
  }
}

