import { Module } from '@nestjs/common';
import { BillingService } from './application/billing.service';
import { BillingController } from './presentation/controllers/billing.controller';

@Module({
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}