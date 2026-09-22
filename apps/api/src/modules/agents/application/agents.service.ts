import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { AgentType, AiExecutionStatus, type Prisma } from '@prisma/client';
import { QueueInfrastructureService } from '../../../common/queue/queue-infrastructure.service';
import { QUEUE_NAMES } from '../../../common/queue/queue.constants';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../../../common/auth';
import type { AgentExecutionJobPayload } from './ports/agent-execution-job.payload';
import { BusinessAgentProfileService } from './runtime/business-agent-profile.service';
import { AgentRuntimeService } from './runtime/agent-runtime.service';

export interface CreateAgentRunInput {
  projectId: string;
  actor: AuthenticatedUser;
  agentType: AgentType;
  state?: unknown;
}

@Injectable()
export class AgentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileService: BusinessAgentProfileService,
    private readonly agentRuntimeService: AgentRuntimeService,
    private readonly queueInfrastructure: QueueInfrastructureService,
  ) {}

  async listProfiles() {
    return this.profileService.list();
  }

  async getProfile(slug: string) {
    return this.profileService.getBySlug(slug);
  }

  async listProjectRuns(projectId: string, actor: AuthenticatedUser) {
    await this.ensureProject(projectId, actor.id);

    return this.prisma.agentRun.findMany({
      where: { projectId, deletedAt: null, project: { createdBy: actor.id, deletedAt: null } },
      include: { aiExecution: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async createRun(input: CreateAgentRunInput) {
    await this.ensureProject(input.projectId, input.actor.id);

    return this.prisma.agentRun.create({
      data: {
        projectId: input.projectId,
        agentType: input.agentType,
        status: AiExecutionStatus.QUEUED,
        state: (input.state ?? {}) as object,
        createdBy: input.actor.id,
        updatedBy: input.actor.id,
      },
      include: { aiExecution: true },
    });
  }

  async chat(input: {
    projectId: string;
    actor: AuthenticatedUser;
    agentSlug?: string;
    message: string;
    conversationId?: string;
  }) {
    await this.ensureProject(input.projectId, input.actor.id);
    const businessAgent = await this.profileService.getBySlug(input.agentSlug);
    return this.agentRuntimeService.execute({
      projectId: input.projectId,
      userId: input.actor.id,
      conversationId: input.conversationId,
      userInput: input.message,
      agentSlug: businessAgent.slug,
    });
  }

  async createQueuedRuntimeRun(input: {
    projectId: string;
    actor: AuthenticatedUser;
    agentSlug?: string;
    message: string;
    conversationId?: string;
  }) {
    await this.ensureProject(input.projectId, input.actor.id);
    const businessAgent = await this.profileService.getBySlug(input.agentSlug);

    const run = await this.prisma.agentRun.create({
      data: {
        projectId: input.projectId,
        conversationId: input.conversationId,
        businessAgentId: businessAgent.id,
        agentType: AgentType.ORCHESTRATOR,
        agentSlug: businessAgent.slug,
        status: AiExecutionStatus.QUEUED,
        input: {
          userInput: input.message,
          agentSlug: businessAgent.slug,
          mode: 'async',
        },
        state: {
          progressLabel: 'Queued',
          progressPercent: 0,
        },
        createdBy: input.actor.id,
        updatedBy: input.actor.id,
      },
    });

    try {
      await this.queueInfrastructure.getQueue<AgentExecutionJobPayload>(QUEUE_NAMES.aiExecution).add(
        'execute-agent-run',
        { agentRunId: run.id },
        this.queueInfrastructure.getJobOptions(run.id),
      );
    } catch (error) {
      await this.prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: AiExecutionStatus.FAILED,
          errorMessage: 'AI execution queue is unavailable.',
          completedAt: new Date(),
          updatedBy: input.actor.id,
        },
      });

      throw new ServiceUnavailableException(
        error instanceof Error ? `AI execution queue is unavailable: ${error.message}` : 'AI execution queue is unavailable.',
      );
    }

    return this.toRunStatus(run);
  }

  async getRunStatus(agentRunId: string, actor: AuthenticatedUser) {
    const run = await this.prisma.agentRun.findFirst({
      where: {
        id: agentRunId,
        deletedAt: null,
        project: { createdBy: actor.id, deletedAt: null },
      },
      include: {
        steps: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            node: true,
            specialist: true,
            status: true,
            model: true,
            startedAt: true,
            completedAt: true,
            error: true,
            metadata: true,
          },
        },
      },
    });

    if (!run) {
      throw new NotFoundException('Agent run not found.');
    }

    return this.toRunStatus(run);
  }

  private toRunStatus(run: Prisma.AgentRunGetPayload<{ include?: { steps: true } }>) {
    const steps = 'steps' in run && Array.isArray(run.steps) ? run.steps : [];
    const finalOutput = run.finalOutput && typeof run.finalOutput === 'object' && !Array.isArray(run.finalOutput)
      ? run.finalOutput as Record<string, unknown>
      : {};
    const state = run.state && typeof run.state === 'object' && !Array.isArray(run.state)
      ? run.state as Record<string, unknown>
      : {};
    const currentStep = steps.find((step) => step.status === AiExecutionStatus.RUNNING) ?? steps.at(-1);

    return {
      runId: run.id,
      status: run.status,
      progressLabel: this.progressLabel(run.status, currentStep?.node, state),
      progressPercent: this.progressPercent(run.status, steps.length, state),
      currentStep: currentStep ? {
        node: currentStep.node,
        specialist: currentStep.specialist,
        status: currentStep.status,
      } : null,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      answer: typeof finalOutput.answer === 'string' ? finalOutput.answer : null,
      sources: Array.isArray(finalOutput.sources) ? finalOutput.sources : [],
      verification: finalOutput.verification ?? null,
      errorMessage: run.status === AiExecutionStatus.FAILED ? run.errorMessage : null,
      steps: steps.map((step) => ({
        id: step.id,
        node: step.node,
        specialist: step.specialist,
        status: step.status,
        model: step.model,
        startedAt: step.startedAt,
        completedAt: step.completedAt,
        error: step.error,
        metadata: step.metadata,
      })),
    };
  }

  private progressLabel(status: AiExecutionStatus, node: string | undefined, state: Record<string, unknown>) {
    if (typeof state.progressLabel === 'string') {
      return state.progressLabel;
    }
    if (status === AiExecutionStatus.QUEUED) {
      return 'Queued';
    }
    if (status === AiExecutionStatus.SUCCEEDED) {
      return 'Completed';
    }
    if (status === AiExecutionStatus.FAILED) {
      return 'Failed';
    }

    const labels: Record<string, string> = {
      load_context: 'Loading company context',
      supervisor: 'Planning the response',
      planner: 'Building an execution plan',
      specialists: 'Analyzing with specialists',
      synthesis: 'Writing final answer',
      verification: 'Verifying response',
    };

    return labels[node ?? ''] ?? 'Working';
  }

  private progressPercent(status: AiExecutionStatus, stepCount: number, state: Record<string, unknown>) {
    if (typeof state.progressPercent === 'number') {
      return state.progressPercent;
    }
    if (status === AiExecutionStatus.QUEUED) {
      return 0;
    }
    if (status === AiExecutionStatus.SUCCEEDED) {
      return 100;
    }
    if (status === AiExecutionStatus.FAILED || status === AiExecutionStatus.CANCELLED) {
      return 100;
    }

    return Math.min(90, 15 + stepCount * 12);
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
}
