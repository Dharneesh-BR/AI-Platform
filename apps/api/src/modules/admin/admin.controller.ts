import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  getHealth() {
    return this.adminHealthService.getHealth();
  }

  @Get('agent-runs')
  listAgentRuns() {
    return this.observabilityService.listAgentRuns();
  }

  @Get('tool-executions')
  listToolExecutions() {
    return this.observabilityService.listToolExecutions();
  }
}
