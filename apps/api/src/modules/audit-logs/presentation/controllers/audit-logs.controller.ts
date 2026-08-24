import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentTenant, PlatformRole, RequireTenant, Roles, type RequestTenantContext } from '../../../../common/auth';
import { AuditLogsService } from '../../application/audit-logs.service';

@ApiBearerAuth()
@ApiTags('Audit Logs')
@RequireTenant()
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles(PlatformRole.SuperAdmin, PlatformRole.Admin)
  list(@CurrentTenant() tenant: RequestTenantContext) {
    return this.auditLogsService.list(tenant.organizationId);
  }
}