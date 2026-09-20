import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentTenant, CurrentUser, PlatformRole, RequireTenant, Roles, type AuthenticatedUser, type RequestTenantContext } from '../../../../common/auth';
import { AgentsService } from '../../application/agents.service';
import { AgentChatDto } from '../dto/agent-chat.dto';
import { CreateAgentRunDto } from '../dto/create-agent-run.dto';

@ApiBearerAuth()
@ApiTags('Agents')
@RequireTenant()
@Controller()
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get('agents')
  @Roles(PlatformRole.SuperAdmin, PlatformRole.Admin, PlatformRole.Consultant)
  listProfiles(@CurrentTenant() tenant: RequestTenantContext) {
    return this.agentsService.listProfiles(tenant);
  }

  @Get('agents/:slug')
  @Roles(PlatformRole.SuperAdmin, PlatformRole.Admin, PlatformRole.Consultant)
  getProfile(@Param('slug') slug: string, @CurrentTenant() tenant: RequestTenantContext) {
    return this.agentsService.getProfile(tenant, slug);
  }

  @Get('projects/:projectId/agent-runs')
  @Roles(PlatformRole.SuperAdmin, PlatformRole.Admin, PlatformRole.Consultant)
  list(@Param('projectId') projectId: string, @CurrentTenant() tenant: RequestTenantContext) {
    return this.agentsService.listProjectRuns(tenant.organizationId, projectId);
  }

  @Get('agent-runs/:agentRunId')
  @Roles(PlatformRole.SuperAdmin, PlatformRole.Admin, PlatformRole.Consultant)
  getRun(@Param('agentRunId') agentRunId: string, @CurrentTenant() tenant: RequestTenantContext) {
    return this.agentsService.getRunStatus(tenant.organizationId, agentRunId);
  }

  @Get('agent-runs/:agentRunId/status')
  @Roles(PlatformRole.SuperAdmin, PlatformRole.Admin, PlatformRole.Consultant)
  getRunStatus(@Param('agentRunId') agentRunId: string, @CurrentTenant() tenant: RequestTenantContext) {
    return this.agentsService.getRunStatus(tenant.organizationId, agentRunId);
  }

  @Post('projects/:projectId/agent-runs')
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

  @Post('projects/:projectId/agents/:slug/chat')
  @Roles(PlatformRole.SuperAdmin, PlatformRole.Admin, PlatformRole.Consultant)
  chat(
    @Param('projectId') projectId: string,
    @Param('slug') slug: string,
    @Body() dto: AgentChatDto,
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agentsService.chat({
      organizationId: tenant.organizationId,
      projectId,
      actor: user,
      actorRole: tenant.role,
      agentSlug: slug,
      message: dto.message,
      conversationId: dto.conversationId,
    });
  }
}
