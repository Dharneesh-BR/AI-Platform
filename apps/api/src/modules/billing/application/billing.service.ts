import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async getBillingAccount(userId: string) {
    const account = await this.prisma.billingAccount.findFirst({
      where: { userId, deletedAt: null },
      include: { usageRecords: { where: { deletedAt: null }, orderBy: { occurredAt: 'desc' }, take: 25 } },
    });

    if (!account) {
      throw new NotFoundException('Billing account not found.');
    }

    return account;
  }
}
