import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PlatformRole, Roles } from '../../../../common/auth';
import { AuditLogsService } from '../../application/audit-logs.service';

@ApiBearerAuth()
@ApiTags('Audit Logs')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles(PlatformRole.SuperAdmin, PlatformRole.Admin)
  list() {
    return this.auditLogsService.list();
  }
}
