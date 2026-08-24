import { Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentTenant,
  CurrentUser,
  RequireTenant,
  type AuthenticatedUser,
  type RequestTenantContext,
} from '../../../../common/auth';
import { GetDiscoveryStatusUseCase } from '../../application/use-cases/get-discovery-status.use-case';
import { RetryDiscoveryUseCase } from '../../application/use-cases/retry-discovery.use-case';

@ApiBearerAuth()
@ApiTags('Discovery Jobs')
@RequireTenant()
@Controller('projects/:projectId/discovery')
export class DiscoveryJobsController {
  constructor(
    private readonly getDiscoveryStatusUseCase: GetDiscoveryStatusUseCase,
    private readonly retryDiscoveryUseCase: RetryDiscoveryUseCase,
  ) {}

  @Get('status')
  getStatus(
    @Param('projectId') projectId: string,
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.getDiscoveryStatusUseCase.execute(tenant.organizationId, projectId, user);
  }

  @Post('retry')
  retry(
    @Param('projectId') projectId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.retryDiscoveryUseCase.execute(
      tenant.organizationId,
      projectId,
      user,
      idempotencyKey,
    );
  }
}

