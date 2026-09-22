import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../../common/auth';
import { AgentsService } from '../../application/agents.service';
import { AgentChatDto } from '../dto/agent-chat.dto';
import { CreateAgentRunDto } from '../dto/create-agent-run.dto';

@ApiBearerAuth()
@ApiTags('Agents')
@Controller()
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get('agents')
  listProfiles() {
    return this.agentsService.listProfiles();
  }

  @Get('agents/:slug')
  getProfile(@Param('slug') slug: string) {
    return this.agentsService.getProfile(slug);
  }

  @Get('projects/:projectId/agent-runs')
  list(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agentsService.listProjectRuns(projectId, user);
  }

  @Get('agent-runs/:agentRunId')
  getRun(
    @Param('agentRunId') agentRunId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agentsService.getRunStatus(agentRunId, user);
  }

  @Get('agent-runs/:agentRunId/status')
  getRunStatus(
    @Param('agentRunId') agentRunId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agentsService.getRunStatus(agentRunId, user);
  }

  @Post('projects/:projectId/agent-runs')
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateAgentRunDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agentsService.createRun({
      projectId,
      actor: user,
      agentType: dto.agentType,
      state: dto.state,
    });
  }

  @Post('projects/:projectId/agents/:slug/chat')
  chat(
    @Param('projectId') projectId: string,
    @Param('slug') slug: string,
    @Body() dto: AgentChatDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agentsService.chat({
      projectId,
      actor: user,
      agentSlug: slug,
      message: dto.message,
      conversationId: dto.conversationId,
    });
  }
}
