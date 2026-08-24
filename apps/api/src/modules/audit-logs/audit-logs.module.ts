import { Module } from '@nestjs/common';
import { AuditLogsService } from './application/audit-logs.service';
import { AuditLogsController } from './presentation/controllers/audit-logs.controller';

@Module({
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
})
export class AuditLogsModule {}