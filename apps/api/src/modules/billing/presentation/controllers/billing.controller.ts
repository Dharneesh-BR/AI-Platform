import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentTenant, PlatformRole, RequireTenant, Roles, type RequestTenantContext } from '../../../../common/auth';
import { BillingService } from '../../application/billing.service';

@ApiBearerAuth()
@ApiTags('Billing')
@RequireTenant()
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('account')
  @Roles(PlatformRole.SuperAdmin, PlatformRole.Admin)
  getAccount(@CurrentTenant() tenant: RequestTenantContext) {
    return this.billingService.getBillingAccount(tenant.organizationId);
  }
}