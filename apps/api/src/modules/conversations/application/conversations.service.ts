import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../../common/auth';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AgentsService } from '../../agents/application/agents.service';
import { AgentRuntimeService } from '../../agents/application/runtime/agent-runtime.service';

export interface CreateConversationInput {
  projectId: string;
  actor: AuthenticatedUser;
  title?: string;
  agentSlug?: string;
}

export interface AddMessageInput {
  conversationId: string;
  actor: AuthenticatedUser;
  content: string;
  agentSlug?: string;
}

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly agentsService: AgentsService,
    private readonly agentRuntimeService: AgentRuntimeService,
  ) {}

  async listProjectConversations(projectId: string, actor: AuthenticatedUser) {
    await this.ensureProject(projectId, actor.id);

    return this.prisma.conversation.findMany({
      where: { projectId, deletedAt: null, project: { createdBy: actor.id, deletedAt: null } },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 8 } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createConversation(input: CreateConversationInput) {
    await this.ensureProject(input.projectId, input.actor.id);

    return this.prisma.conversation.create({
      data: {
        projectId: input.projectId,
        title: input.title ?? 'New AI consulting chat',
        metadata: {
          source: 'ai-chat-api',
          ...(input.agentSlug ? { agentSlug: input.agentSlug } : {}),
        },
        createdBy: input.actor.id,
        updatedBy: input.actor.id,
      },
      include: { messages: true },
    });
  }

  async addMessage(input: AddMessageInput) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: input.conversationId,
        deletedAt: null,
        project: { createdBy: input.actor.id, deletedAt: null },
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
      projectId: conversation.projectId,
      userId: input.actor.id,
      conversationId: input.conversationId,
      userInput: input.content,
      agentSlug: input.agentSlug,
    };
    const executionMode = await this.agentRuntimeService.classifyExecutionMode(runtimeInput);

    if (executionMode === 'async') {
      const runStatus = await this.agentsService.createQueuedRuntimeRun({
        projectId: conversation.projectId,
        actor: input.actor,
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
      if (!runtimeResult.answer?.trim()) {
        runtimeResult.answer = this.fallbackAnswer(conversation.project, input.content);
        runtimeResult.model = runtimeResult.model ?? 'fallback';
      }
    } catch (error) {
      this.logger.warn(
        `Agent runtime unavailable; returning project-aware fallback. conversationId=${input.conversationId} reason=${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      runtimeResult = {
        runId: null,
        answer: this.fallbackAnswer(conversation.project, input.content),
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

  private async ensureProject(projectId: string, actorUserId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, createdBy: actorUserId, deletedAt: null },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }
  }

  private fallbackAnswer(
    project: {
      name: string;
      description: string | null;
      projectProfile: {
        companyName: string;
        websiteUrl: string | null;
        industry: string | null;
        businessModel: string | null;
        targetMarket: string | null;
        businessGoals: unknown;
        primaryChallenges: unknown;
      } | null;
      companyProfiles: Array<{
        mission: string | null;
        vision: string | null;
        industry: string | null;
        targetCustomers: unknown;
        products: unknown;
        services: unknown;
        painPoints: unknown;
        uniqueSellingProposition: string | null;
        summaries: unknown;
      }>;
      researchSources: Array<{
        title: string;
        content: unknown;
      }>;
    },
    userInput: string,
  ): string {
    const projectProfile = project.projectProfile;
    const companyProfile = project.companyProfiles[0];
    const companyName = projectProfile?.companyName || project.name;
    const products = this.asStringArray(companyProfile?.products);
    const services = this.asStringArray(companyProfile?.services);
    const painPoints = this.asStringArray(companyProfile?.painPoints);
    const challenges = this.asStringArray(projectProfile?.primaryChallenges);
    const targetCustomers = this.asStringArray(companyProfile?.targetCustomers);
    const businessModel = this.meaningfulBusinessModel(projectProfile?.businessModel, project.description);
    const positioning = companyProfile?.uniqueSellingProposition ?? companyProfile?.mission;
    const isReportRequest = /\b(report|readiness|growth|summary|assessment)\b/i.test(userInput);
    const opportunityAreas = this.uniqueStrings([
      ...products.slice(0, 2),
      ...services.slice(0, 2),
      projectProfile?.industry,
    ].filter((item): item is string => Boolean(item)));
    const priorityGaps = this.uniqueStrings([
      ...painPoints.slice(0, 3),
      ...challenges.slice(0, 3),
    ]);

    if (isReportRequest) {
      return [
        `${companyName} AI Readiness and Growth Report`,
        '',
        'Executive summary',
        `${companyName} appears ready for a practical first phase of AI adoption focused on customer support, sales assistance, website-led discovery, and operational clarity. The current profile is based on onboarding data and public website discovery, so it should be treated as a useful first draft rather than a final strategy document.`,
        '',
        'Current business context',
        `- Industry: ${companyProfile?.industry ?? projectProfile?.industry ?? 'Not provided'}`,
        `- Website: ${projectProfile?.websiteUrl ?? 'Not provided'}`,
        `- Business model: ${businessModel ?? 'Cycle and e-bike retail/service business; confirm exact revenue streams.'}`,
        `- Target customers: ${targetCustomers.length ? targetCustomers.join(', ') : projectProfile?.targetMarket ?? 'Cycling and urban mobility customers'}`,
        `- Positioning: ${positioning ?? 'Premium cycling and e-bike mobility brand; refine with stronger proof points.'}`,
        '',
        'AI opportunity areas',
        ...(opportunityAreas.length
          ? opportunityAreas.slice(0, 5).map((item) => `- ${item}`)
          : [
              '- Customer inquiry handling and FAQs',
              '- Sales qualification for cycle and e-bike buyers',
              '- Product/service recommendation support',
              '- Follow-up workflows for leads and service customers',
            ]),
        '',
        'Priority gaps',
        ...(priorityGaps.length
          ? priorityGaps.slice(0, 5).map((item) => `- ${item}`)
          : [
              '- Clear product/category data',
              '- Customer segment definitions',
              '- Competitor comparison',
              '- Service workflow details',
            ]),
        '',
        'Recommended 30-day action plan',
        '1. Confirm the product/service categories and top customer segments.',
        '2. Add website FAQs, product details, service details, and sales objections as knowledge inputs.',
        '3. Launch one customer-support assistant flow for common buyer and service questions.',
        '4. Build a simple sales-assistance workflow for lead qualification and recommendations.',
        '5. Review AI answers weekly and convert repeated questions into better knowledge content.',
      ].join('\n').trim();
    }

    return [
      `Here is a project-aware first-pass answer for ${companyName}.`,
      '',
      `Question: ${userInput}`,
      '',
      'Current business context:',
      `- Industry: ${companyProfile?.industry ?? projectProfile?.industry ?? 'Not provided'}`,
      `- Website: ${projectProfile?.websiteUrl ?? 'Not provided'}`,
      `- Business model: ${businessModel ?? 'Cycle and e-bike retail/service business; confirm exact revenue streams.'}`,
      `- Target customers: ${targetCustomers.length ? targetCustomers.join(', ') : projectProfile?.targetMarket ?? 'Not provided'}`,
      `- Positioning: ${positioning ?? 'Not enough detail yet'}`,
      '',
      'Useful focus areas:',
      ...(opportunityAreas.length
        ? opportunityAreas.slice(0, 4).map((item) => `- ${item}`)
        : ['- Clarify the highest-value customer segments', '- Turn the website discovery into a sharper offer map']),
      '',
      'Priority gaps to close next:',
      ...(priorityGaps.length
        ? priorityGaps.slice(0, 4).map((item) => `- ${item}`)
        : ['- Customer acquisition proof points', '- Competitive differentiation', '- Operational workflow details']),
      '',
      'Recommended next steps:',
      `1. Use the generated profile as the baseline for ${companyName}.`,
      `2. Validate the products/services and target customers against the actual website and sales reality.`,
      `3. Add one or two source documents later, but do not block the MVP flow on that.`,
      `4. Generate the readiness/growth report and use the gaps above as the first action plan.`,
    ].join('\n').trim();
  }

  private asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>;
          const label = record.name ?? record.title ?? record.label ?? record.description;
          return typeof label === 'string' ? label : undefined;
        }
        return undefined;
      })
      .filter((item): item is string => Boolean(item?.trim()));
  }

  private uniqueStrings(values: string[]): string[] {
    const seen = new Set<string>();

    return values.filter((value) => {
      const normalized = value.trim().toLowerCase();
      if (!normalized || seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
  }

  private meaningfulBusinessModel(...values: Array<string | null | undefined>): string | undefined {
    const placeholders = [
      'business workspace for consulting, research, and growth planning',
      'business workspace for consulting, research, and growth planning.',
    ];

    return values.find((value) => {
      const normalized = value?.trim().toLowerCase();
      return normalized ? !placeholders.includes(normalized) : false;
    })?.trim();
  }
}
