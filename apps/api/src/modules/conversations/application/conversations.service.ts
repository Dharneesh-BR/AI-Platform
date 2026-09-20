import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AuthenticatedUser, PlatformRole } from '../../../common/auth';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AgentsService } from '../../agents/application/agents.service';
import { AgentRuntimeService } from '../../agents/application/runtime/agent-runtime.service';

export interface CreateConversationInput {
  organizationId: string;
  projectId: string;
  actorUserId: string;
  title?: string;
  agentSlug?: string;
}

export interface AddMessageInput {
  organizationId: string;
  conversationId: string;
  actor: AuthenticatedUser;
  actorRole?: PlatformRole;
  content: string;
  agentSlug?: string;
}

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agentsService: AgentsService,
    private readonly agentRuntimeService: AgentRuntimeService,
  ) {}

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
        metadata: {
          source: 'ai-chat-api',
          ...(input.agentSlug ? { agentSlug: input.agentSlug } : {}),
        },
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
      include: {
        project: {
          include: {
            companyProfiles: {
              take: 1,
              orderBy: { version: 'desc' },
            },
            projectProfile: true,
            researchSources: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 8 },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    await this.prisma.conversationMessage.create({
      data: {
        conversationId: input.conversationId,
        authorUserId: input.actor.id,
        role: 'user',
        content: input.content,
        metadata: {},
        createdBy: input.actor.id,
        updatedBy: input.actor.id,
      },
    });

    const runtimeInput = {
      organizationId: input.organizationId,
      projectId: conversation.projectId,
      userId: input.actor.id,
      conversationId: input.conversationId,
      userInput: input.content,
      agentSlug: input.agentSlug,
    };
    const executionMode = await this.agentRuntimeService.classifyExecutionMode(runtimeInput);

    if (executionMode === 'async') {
      const runStatus = await this.agentsService.createQueuedRuntimeRun({
        organizationId: input.organizationId,
        projectId: conversation.projectId,
        actor: input.actor,
        actorRole: input.actorRole,
        conversationId: input.conversationId,
        message: input.content,
        agentSlug: input.agentSlug,
      });

      await this.prisma.conversationMessage.create({
        data: {
          conversationId: input.conversationId,
          role: 'assistant',
          content: 'Magnafic AI is working on this multi-step request. Progress will update here shortly.',
          metadata: {
            generatedBy: 'agent-runtime',
            mode: 'async',
            agentRunId: runStatus.runId,
            status: runStatus.status,
            progressLabel: runStatus.progressLabel,
          } as unknown as Prisma.InputJsonValue,
          createdBy: input.actor.id,
          updatedBy: input.actor.id,
        },
      });

      const updatedConversation = await this.prisma.conversation.findUniqueOrThrow({
        where: { id: input.conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });

      return {
        ...updatedConversation,
        mode: 'async',
        runId: runStatus.runId,
        status: runStatus.status,
      };
    }

    let runtimeResult;

    try {
      runtimeResult = await this.agentRuntimeService.execute(runtimeInput);
    } catch {
      runtimeResult = {
        runId: null,
        answer: this.fallbackAnswer(conversation.project.name, input.content),
        agentSlug: input.agentSlug ?? 'magnafic-ai',
        agentName: 'Magnafic AI',
        model: 'fallback',
        totalTokens: 0,
        verification: null,
        sources: [],
      };
    }

    await this.prisma.conversationMessage.create({
      data: {
        conversationId: input.conversationId,
        role: 'assistant',
        content: runtimeResult.answer,
        metadata: {
          generatedBy: 'agent-runtime',
          agentRunId: runtimeResult.runId,
          agentSlug: runtimeResult.agentSlug,
          agentName: runtimeResult.agentName,
          model: runtimeResult.model,
          totalTokens: runtimeResult.totalTokens,
          verification: runtimeResult.verification,
          sources: runtimeResult.sources,
        } as unknown as Prisma.InputJsonValue,
        createdBy: input.actor.id,
        updatedBy: input.actor.id,
      },
    });

    const updatedConversation = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: input.conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    return {
      ...updatedConversation,
      mode: 'sync',
      runId: runtimeResult.runId,
      status: 'SUCCEEDED',
    };
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

  private fallbackAnswer(projectName: string, userInput: string): string {
    return [
      `Here is a practical first-pass answer for ${projectName}.`,
      '',
      `Question: ${userInput}`,
      '',
      'Recommended next steps:',
      '1. Confirm the project onboarding details are accurate.',
      '2. Upload source documents or paste business context into Knowledge.',
      '3. Ask a narrower follow-up question after the knowledge base has processed.',
      '4. Generate a report once the key project facts are in place.',
    ].join('\n');
  }
}
