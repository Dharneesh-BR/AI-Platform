import { Injectable, NotFoundException } from '@nestjs/common';
import { ResearchStatus } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

export interface CreateResearchPlanInput {
  organizationId: string;
  projectId: string;
  actorUserId: string;
  title: string;
  question: string;
  objectives?: string[];
}

@Injectable()
export class ResearchService {
  constructor(private readonly prisma: PrismaService) {}

  async listPlans(organizationId: string, projectId: string) {
    await this.ensureProject(organizationId, projectId);

    return this.prisma.researchPlan.findMany({
      where: { projectId, deletedAt: null },
      include: { findings: true, citations: true, validations: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPlan(input: CreateResearchPlanInput) {
    await this.ensureProject(input.organizationId, input.projectId);

    return this.prisma.researchPlan.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        question: input.question,
        objectives: input.objectives ?? [],
        status: ResearchStatus.PLANNED,
        plan: {
          steps: [
            'Confirm business question',
            'Search approved company context',
            'Draft findings with citations',
            'Validate with human review',
          ],
        },
        createdBy: input.actorUserId,
        updatedBy: input.actorUserId,
      },
      include: { findings: true, citations: true, validations: true },
    });
  }

  async getPlan(organizationId: string, projectId: string, researchPlanId: string) {
    await this.ensureProject(organizationId, projectId);

    const plan = await this.prisma.researchPlan.findFirst({
      where: { id: researchPlanId, projectId, deletedAt: null },
      include: { findings: true, citations: true, validations: true },
    });

    if (!plan) {
      throw new NotFoundException('Research plan not found.');
    }

    return plan;
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