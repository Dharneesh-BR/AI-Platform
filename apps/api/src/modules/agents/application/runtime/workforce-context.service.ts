import { Injectable } from '@nestjs/common';
import { Prisma, ProjectLifecycleState } from '@prisma/client';
import type { AuthenticatedUser } from '../../../../common/auth';
import { PrismaService } from '../../../../common/prisma/prisma.service';

@Injectable()
export class WorkforceContextService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureProject(actor: AuthenticatedUser): Promise<{ id: string }> {
    const existing = await this.prisma.project.findFirst({
      where: {
        createdBy: actor.id,
        deletedAt: null,
        lifecycleState: ProjectLifecycleState.AI_READY,
        metadata: {
          path: ['setupMode'],
          equals: 'admin-managed',
        },
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    if (existing) {
      return existing;
    }

    const fallback = await this.prisma.project.findFirst({
      where: {
        createdBy: actor.id,
        deletedAt: null,
        lifecycleState: ProjectLifecycleState.AI_READY,
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    if (fallback) {
      return fallback;
    }

    return this.prisma.$transaction(async (tx) => {
      const createdProject = await tx.project.create({
        data: {
          name: 'AI Workforce',
          slug: await this.resolveUniqueSlug(actor.id),
          description: 'Admin-managed AI workforce context.',
          lifecycleState: ProjectLifecycleState.AI_READY,
          metadata: {
            setupMode: 'admin-managed',
            aiReadyByDefault: true,
            hiddenFromWorkforceFlow: true,
          },
          createdBy: actor.id,
          updatedBy: actor.id,
        },
        select: { id: true },
      });

      await tx.projectProfile.create({
        data: {
          projectId: createdProject.id,
          companyName: 'AI Workforce',
          businessModel: 'Admin-managed AI workforce knowledge and conversation context.',
          businessGoals: [
            'Answer questions using admin-managed workforce knowledge',
            'Route work to the right specialist agents',
            'Keep onboarding hidden from end users',
          ] as Prisma.InputJsonArray,
          primaryChallenges: [
            'Keep workforce knowledge current',
            'Route questions to the right specialists',
          ] as Prisma.InputJsonArray,
          competitors: [] as Prisma.InputJsonArray,
          documents: [] as Prisma.InputJsonArray,
          brandGuidelines: [] as Prisma.InputJsonArray,
          strategyDocuments: [] as Prisma.InputJsonArray,
          onboardingStep: 'admin-managed',
          completedAt: new Date(),
          createdBy: actor.id,
          updatedBy: actor.id,
        },
      });

      return createdProject;
    });
  }

  async ensureProjectId(actor: AuthenticatedUser): Promise<string> {
    const project = await this.ensureProject(actor);
    return project.id;
  }

  private async resolveUniqueSlug(userId: string): Promise<string> {
    const base = 'ai-workforce';
    const existing = await this.prisma.project.findMany({
      where: {
        createdBy: userId,
        slug: { startsWith: base },
      },
      select: { slug: true },
      take: 100,
    });
    const existingSlugs = new Set(existing.map((project) => project.slug));

    if (!existingSlugs.has(base)) {
      return base;
    }

    for (let suffix = 2; suffix <= 100; suffix += 1) {
      const candidate = `${base}-${suffix}`;
      if (!existingSlugs.has(candidate)) {
        return candidate;
      }
    }

    return `${base}-${Date.now()}`;
  }
}
