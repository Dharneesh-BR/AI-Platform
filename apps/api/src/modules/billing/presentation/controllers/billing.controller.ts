import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../../common/auth';
import { BillingService } from '../../application/billing.service';

@ApiBearerAuth()
@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('account')
  getAccount(@CurrentUser() user: AuthenticatedUser) {
    return this.billingService.getBillingAccount(user.id);
  }
}
