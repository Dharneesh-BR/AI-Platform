import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentTenant, CurrentUser, PlatformRole, RequireTenant, Roles, type AuthenticatedUser, type RequestTenantContext } from '../../../../common/auth';
import { AgentsService } from '../../application/agents.service';
import { CreateAgentRunDto } from '../dto/create-agent-run.dto';

@ApiBearerAuth()
@ApiTags('Agents')
@RequireTenant()
@Controller('projects/:projectId/agent-runs')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  @Roles(PlatformRole.SuperAdmin, PlatformRole.Admin, PlatformRole.Consultant)
  list(@Param('projectId') projectId: string, @CurrentTenant() tenant: RequestTenantContext) {
    return this.agentsService.listProjectRuns(tenant.organizationId, projectId);
  }

  @Post()
  @Roles(PlatformRole.SuperAdmin, PlatformRole.Admin, PlatformRole.Consultant)
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateAgentRunDto,
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agentsService.createRun({
      organizationId: tenant.organizationId,
      projectId,
      actorUserId: user.id,
      agentType: dto.agentType,
      state: dto.state,
    });
  }
}