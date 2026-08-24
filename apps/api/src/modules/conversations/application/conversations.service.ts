import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

export interface CreateConversationInput {
  organizationId: string;
  projectId: string;
  actorUserId: string;
  title?: string;
}

export interface AddMessageInput {
  organizationId: string;
  conversationId: string;
  actorUserId: string;
  content: string;
}

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProjectConversations(organizationId: string, projectId: string) {
    await this.ensureProject(organizationId, projectId);

    return this.prisma.conversation.findMany({
      where: { projectId, deletedAt: null },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 8 } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createConversation(input: CreateConversationInput) {
    await this.ensureProject(input.organizationId, input.projectId);

    return this.prisma.conversation.create({
      data: {
        projectId: input.projectId,
        title: input.title ?? 'New AI consulting chat',
        metadata: { source: 'mvp-chat-api' },
        createdBy: input.actorUserId,
        updatedBy: input.actorUserId,
      },
      include: { messages: true },
    });
  }

  async addMessage(input: AddMessageInput) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: input.conversationId,
        deletedAt: null,
        project: { organizationId: input.organizationId, deletedAt: null },
      },
      include: { project: { include: { companyProfiles: { where: { isApproved: true }, take: 1, orderBy: { version: 'desc' } } } } },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    await this.prisma.conversationMessage.create({
      data: {
        conversationId: input.conversationId,
        authorUserId: input.actorUserId,
        role: 'user',
        content: input.content,
        metadata: {},
        createdBy: input.actorUserId,
        updatedBy: input.actorUserId,
      },
    });

    const approvedProfile = conversation.project.companyProfiles[0];
    const assistantContent = approvedProfile
      ? `Based on the approved ${approvedProfile.industry ?? 'company'} profile, Magnafic AI should answer this through the project context: ${input.content}`
      : `I can answer once onboarding and company profile approval are complete. Your question was: ${input.content}`;

    await this.prisma.conversationMessage.create({
      data: {
        conversationId: input.conversationId,
        role: 'assistant',
        content: assistantContent,
        metadata: { generatedBy: 'deterministic-mvp-assistant' },
        createdBy: input.actorUserId,
        updatedBy: input.actorUserId,
      },
    });

    return this.prisma.conversation.findUniqueOrThrow({
      where: { id: input.conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  private async ensureProject(organizationId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId, deletedAt: null },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }
  }
}