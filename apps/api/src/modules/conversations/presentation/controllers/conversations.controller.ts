import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../../common/auth';
import { ConversationsService } from '../../application/conversations.service';
import { AddMessageDto } from '../dto/add-message.dto';
import { CreateConversationDto } from '../dto/create-conversation.dto';

@ApiBearerAuth()
@ApiTags('Conversations')
@Controller()
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get('projects/:projectId/conversations')
  list(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.conversationsService.listProjectConversations(projectId, user);
  }

  @Post('projects/:projectId/conversations')
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.conversationsService.createConversation({
      projectId,
      actor: user,
      title: dto.title,
      agentSlug: dto.agentSlug,
    });
  }

  @Post('conversations/:conversationId/messages')
  addMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: AddMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.conversationsService.addMessage({
      conversationId,
      actor: user,
      content: dto.content,
      agentSlug: dto.agentSlug,
    });
  }
}
