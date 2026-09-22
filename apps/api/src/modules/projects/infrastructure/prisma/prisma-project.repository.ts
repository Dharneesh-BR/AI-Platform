import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, ProjectLifecycleState as PrismaProjectLifecycleState, type Project } from '@prisma/client';
import { getProjectRouteForLifecycle, ProjectLifecycleState } from '@platform/domain';
import type { AuthenticatedUser } from '../../../../common/auth';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { ProjectEntity } from '../../domain/entities/project.entity';
import type { CreateProjectInput, ProjectRepository, UpdateProjectInput } from '../../domain/repositories/project.repository';

@Injectable()
export class PrismaProjectRepository implements ProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateProjectInput): Promise<ProjectEntity> {
    let project: Project;

    try {
      const slug = await this.resolveUniqueSlug(input.slug, input.actor.id);
      project = await this.prisma.$transaction(async (tx) => {
        const createdProject = await tx.project.create({
          data: {
            name: input.name,
            slug,
            description: input.description,
            lifecycleState: PrismaProjectLifecycleState.CREATED,
            createdBy: input.actor.id,
            updatedBy: input.actor.id,
          },
        });

        await tx.projectProfile.create({
          data: {
            projectId: createdProject.id,
            companyName: input.name,
            businessModel:
              input.description ??
              'Business workspace for consulting, research, and growth planning.',
            businessGoals: [
              'Clarify positioning',
              'Understand customers',
              'Prioritize growth opportunities',
            ] as Prisma.InputJsonArray,
            primaryChallenges: [
              'Scattered business context',
              'Manual research',
              'Unclear next priorities',
            ] as Prisma.InputJsonArray,
            competitors: [] as Prisma.InputJsonArray,
            documents: [] as Prisma.InputJsonArray,
            brandGuidelines: [] as Prisma.InputJsonArray,
            strategyDocuments: [] as Prisma.InputJsonArray,
            onboardingStep: 'company-basics',
            createdBy: input.actor.id,
            updatedBy: input.actor.id,
          },
        });

        return createdProject;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A project with this slug already exists. Try another project name.');
      }

      throw error;
    }

    return this.mapProject(project);
  }

  private async resolveUniqueSlug(requestedSlug: string, userId: string): Promise<string> {
    const normalizedBase = requestedSlug.trim().toLowerCase();
    const base = normalizedBase || `project-${userId.slice(0, 8)}`;
    const existing = await this.prisma.project.findMany({
      where: {
        createdBy: userId,
        slug: {
          startsWith: base,
        },
      },
      select: { slug: true },
      take: 100,
    });
    const existingSlugs = new Set(existing.map((project) => project.slug));

    if (!existingSlugs.has(base)) {
      return base;
    }

    const userScopedBase = `${base}-${userId.slice(0, 8)}`;
    if (!existingSlugs.has(userScopedBase)) {
      return userScopedBase;
    }

    for (let suffix = 2; suffix < 100; suffix += 1) {
      const candidate = `${userScopedBase}-${suffix}`;
      if (!existingSlugs.has(candidate)) {
        return candidate;
      }
    }

    return `${userScopedBase}-${Date.now()}`;
  }

  async list(actor: AuthenticatedUser): Promise<ProjectEntity[]> {
    const projects = await this.prisma.project.findMany({
      where: { createdBy: actor.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map((project) => this.mapProject(project));
  }

  async findById(
    projectId: string,
    actor: AuthenticatedUser,
  ): Promise<ProjectEntity | null> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, createdBy: actor.id, deletedAt: null },
    });

    return project ? this.mapProject(project) : null;
  }

  async update(input: UpdateProjectInput): Promise<ProjectEntity> {
    const existing = await this.prisma.project.findFirst({
      where: {
        id: input.projectId,
        createdBy: input.actor.id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new ForbiddenException('You do not own this project.');
    }

    const project = await this.prisma.project.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        description: input.description,
        updatedBy: input.actor.id,
      },
    });

    return this.mapProject(project);
  }

  async delete(projectId: string, actor: AuthenticatedUser): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, createdBy: actor.id, deletedAt: null },
      select: { id: true },
    });

    if (!project) {
      throw new ForbiddenException('You do not own this project.');
    }

    await this.prisma.$transaction(async (tx) => {
      const researchPlans = await tx.researchPlan.findMany({
        where: { projectId },
        select: { id: true },
      });
      const researchPlanIds = researchPlans.map((plan) => plan.id);
      const conversations = await tx.conversation.findMany({
        where: { projectId },
        select: { id: true },
      });
      const conversationIds = conversations.map((conversation) => conversation.id);
      const reports = await tx.report.findMany({
        where: { projectId },
        select: { id: true },
      });
      const reportIds = reports.map((report) => report.id);
      const documents = await tx.knowledgeDocument.findMany({
        where: { projectId },
        select: { id: true },
      });
      const documentIds = documents.map((document) => document.id);
      const agentRuns = await tx.agentRun.findMany({
        where: { projectId },
        select: { id: true },
      });
      const agentRunIds = agentRuns.map((run) => run.id);

      if (researchPlanIds.length) {
        await tx.validationResult.deleteMany({ where: { researchPlanId: { in: researchPlanIds } } });
        await tx.citation.deleteMany({ where: { researchPlanId: { in: researchPlanIds } } });
        await tx.researchFinding.deleteMany({ where: { researchPlanId: { in: researchPlanIds } } });
      }

      if (reportIds.length) {
        await tx.reportSection.deleteMany({ where: { reportId: { in: reportIds } } });
      }

      if (conversationIds.length) {
        await tx.conversationMessage.deleteMany({ where: { conversationId: { in: conversationIds } } });
      }

      if (documentIds.length) {
        await tx.documentChunk.deleteMany({ where: { documentId: { in: documentIds } } });
      }

      if (agentRunIds.length) {
        await tx.toolExecution.deleteMany({ where: { agentRunId: { in: agentRunIds } } });
        await tx.agentStep.deleteMany({ where: { agentRunId: { in: agentRunIds } } });
      }

      await tx.researchPlan.deleteMany({ where: { projectId } });
      await tx.report.deleteMany({ where: { projectId } });
      await tx.agentRun.deleteMany({ where: { projectId } });
      await tx.conversation.deleteMany({ where: { projectId } });
      await tx.knowledgeDocument.deleteMany({ where: { projectId } });
      await tx.researchSource.deleteMany({ where: { projectId } });
      await tx.companyGoal.deleteMany({ where: { projectId } });
      await tx.companyCompetitor.deleteMany({ where: { projectId } });
      await tx.companyTechnology.deleteMany({ where: { projectId } });
      await tx.companyProfile.deleteMany({ where: { projectId } });
      await tx.discoveryJob.deleteMany({ where: { projectId } });
      await tx.projectProfile.deleteMany({ where: { projectId } });
      await tx.project.delete({ where: { id: projectId } });
    });
  }

  private mapProject(project: Project): ProjectEntity {
    const lifecycleState = project.lifecycleState as ProjectLifecycleState;
    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description,
      status: project.status,
      lifecycleState,
      metadata:
        project.metadata && typeof project.metadata === 'object' && !Array.isArray(project.metadata)
          ? project.metadata
          : {},
      nextRoute: getProjectRouteForLifecycle(lifecycleState, project.id),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      deletedAt: project.deletedAt,
      createdBy: project.createdBy,
      updatedBy: project.updatedBy,
    };
  }
}
