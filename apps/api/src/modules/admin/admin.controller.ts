import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PlatformRole, Roles } from '../../common/auth';
import { AdminHealthService } from './admin-health.service';
import { AdminObservabilityService } from './admin-observability.service';

@ApiBearerAuth()
@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminHealthService: AdminHealthService,
    private readonly observabilityService: AdminObservabilityService,
  ) {}

  @Get('health')
  @Roles(PlatformRole.SuperAdmin)
  getHealth() {
    return this.adminHealthService.getHealth();
  }

  @Get('agent-runs')
  @Roles(PlatformRole.SuperAdmin)
  listAgentRuns() {
    return this.observabilityService.listAgentRuns();
  }

  @Get('tool-executions')
  @Roles(PlatformRole.SuperAdmin)
  listToolExecutions() {
    return this.observabilityService.listToolExecutions();
  }
}
