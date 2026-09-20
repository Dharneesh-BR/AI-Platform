import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentTenant, CurrentUser, RequireTenant, type AuthenticatedUser, type RequestTenantContext } from '../../../../common/auth';
import { ConversationsService } from '../../application/conversations.service';
import { AddMessageDto } from '../dto/add-message.dto';
import { CreateConversationDto } from '../dto/create-conversation.dto';

@ApiBearerAuth()
@ApiTags('Conversations')
@RequireTenant()
@Controller()
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get('projects/:projectId/conversations')
  list(@Param('projectId') projectId: string, @CurrentTenant() tenant: RequestTenantContext) {
    return this.conversationsService.listProjectConversations(tenant.organizationId, projectId);
  }

  @Post('projects/:projectId/conversations')
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateConversationDto,
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.conversationsService.createConversation({
      organizationId: tenant.organizationId,
      projectId,
      actorUserId: user.id,
      title: dto.title,
      agentSlug: dto.agentSlug,
    });
  }

  @Post('conversations/:conversationId/messages')
  addMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: AddMessageDto,
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.conversationsService.addMessage({
      organizationId: tenant.organizationId,
      conversationId,
      actor: user,
      actorRole: tenant.role,
      content: dto.content,
      agentSlug: dto.agentSlug,
    });
  }
}
