import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectLifecycleState, ReportStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../../../common/auth';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LiteLlmGatewayService } from '../../ai/application/services/litellm-gateway.service';

export interface CreateReportInput {
  projectId: string;
  actor: AuthenticatedUser;
  title: string;
  sections?: Array<{ title: string; kind: string; content: unknown }>;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly liteLlmGateway: LiteLlmGatewayService,
  ) {}

  async listProjectReports(projectId: string, actor: AuthenticatedUser) {
    await this.ensureProject(projectId, actor.id);

    return this.prisma.report.findMany({
      where: { projectId, deletedAt: null, project: { createdBy: actor.id, deletedAt: null } },
      include: { sections: { orderBy: { ordinal: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReport(input: CreateReportInput) {
    const project = await this.ensureProject(input.projectId, input.actor.id);
    if (project.lifecycleState !== ProjectLifecycleState.AI_READY) {
      throw new ForbiddenException('Approve the company profile before generating reports for this project.');
    }

    const sections = input.sections?.length
      ? input.sections
      : await this.generateReportSections(input, project);

    return this.prisma.report.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        status: ReportStatus.READY,
        metadata: { generatedBy: input.sections?.length ? 'manual-api' : 'ai-report-api' },
        createdBy: input.actor.id,
        updatedBy: input.actor.id,
        sections: {
          create: sections.map((section, index) => ({
            title: section.title,
            kind: section.kind,
            ordinal: index + 1,
            content: section.content as object,
            createdBy: input.actor.id,
            updatedBy: input.actor.id,
          })),
        },
      },
      include: { sections: { orderBy: { ordinal: 'asc' } } },
    });
  }

  async getReport(reportId: string, actor: AuthenticatedUser) {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, deletedAt: null, project: { createdBy: actor.id, deletedAt: null } },
      include: { sections: { orderBy: { ordinal: 'asc' } }, project: true },
    });

    if (!report) {
      throw new NotFoundException('Report not found.');
    }

    return report;
  }

  private async ensureProject(projectId: string, actorUserId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, createdBy: actorUserId, deletedAt: null },
      include: {
        projectProfile: true,
        companyProfiles: {
          take: 1,
          orderBy: { version: 'desc' },
        },
        researchSources: {
          where: { deletedAt: null },
          take: 8,
          orderBy: { createdAt: 'desc' },
        },
        researchPlans: {
          where: { deletedAt: null },
          include: { findings: true, citations: true },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    return project;
  }

  private async generateReportSections(
    input: CreateReportInput,
    project: Awaited<ReturnType<ReportsService['ensureProject']>>,
  ): Promise<Array<{ title: string; kind: string; content: unknown }>> {
    try {
      const aiResult = await this.liteLlmGateway.generateText({
        temperature: 0.25,
        maxTokens: 1400,
        metadata: {
          feature: 'report-generation',
          projectId: input.projectId,
        },
        messages: [
          {
            role: 'system',
            content:
              'You generate concise stakeholder-ready consulting report sections. Return strict JSON only with this shape: ' +
              '{"sections":[{"title":"string","kind":"narrative|findings|roadmap|risks","content":{"text":"string","bullets":["string"]}}]}',
          },
          {
            role: 'user',
            content: [
              `Report title: ${input.title}`,
              `Project: ${project.name}`,
              `Project description: ${project.description ?? 'Not provided'}`,
              `Onboarding profile: ${JSON.stringify(project.projectProfile ?? {})}`,
              `Approved company profile: ${JSON.stringify(project.companyProfiles[0] ?? {})}`,
              `Knowledge sources: ${JSON.stringify(
                project.researchSources.map((source) => ({
                  title: source.title,
                  type: source.type,
                  content: source.content,
                })),
              )}`,
              `Research plans: ${JSON.stringify(
                project.researchPlans.map((plan) => ({
                  title: plan.title,
                  question: plan.question,
                  findings: plan.findings,
                  citations: plan.citations,
                })),
              )}`,
            ].join('\n\n'),
          },
        ],
      });

      return this.parseSections(aiResult.content, aiResult.provider, aiResult.model);
    } catch {
      return this.fallbackSections(project);
    }
  }

  private fallbackSections(
    project: Awaited<ReturnType<ReportsService['ensureProject']>>,
  ): Array<{ title: string; kind: string; content: unknown }> {
    const profile = project.companyProfiles[0];
    const onboarding = project.projectProfile;
    const goals = Array.isArray(onboarding?.businessGoals) ? onboarding.businessGoals : [];
    const challenges = Array.isArray(onboarding?.primaryChallenges) ? onboarding.primaryChallenges : [];
    const products = Array.isArray(profile?.products) ? profile.products : [];
    const services = Array.isArray(profile?.services) ? profile.services : [];

    return [
      {
        title: 'Executive Summary',
        kind: 'narrative',
        content: {
          text: `${project.name} has an initial AI-ready workspace with onboarding context, discovery output, and project knowledge available for strategy work.`,
          bullets: [
            onboarding?.companyName ? `Company context captured for ${onboarding.companyName}.` : 'Company context is ready for refinement.',
            profile?.industry || onboarding?.industry ? `Industry context: ${profile?.industry ?? onboarding?.industry}.` : 'Industry context can be enriched during onboarding.',
            'Next step: add source documents and use the AI workforce to turn context into recommendations.',
          ],
          generatedBy: 'fallback-report-generator',
        },
      },
      {
        title: 'Current Business Context',
        kind: 'findings',
        content: {
          text: 'This section summarizes what the platform currently knows.',
          bullets: [
            ...goals.slice(0, 4).map((goal) => `Goal: ${String(goal)}`),
            ...challenges.slice(0, 4).map((challenge) => `Challenge: ${String(challenge)}`),
            ...products.slice(0, 3).map((product) => `Product: ${String(product)}`),
            ...services.slice(0, 3).map((service) => `Service: ${String(service)}`),
          ].slice(0, 8),
        },
      },
      {
        title: 'Recommended Next Actions',
        kind: 'roadmap',
        content: {
          text: 'Use the next week to convert setup into evidence-backed decisions.',
          bullets: [
            'Upload company documents, notes, product details, and customer context.',
            'Ask the AI workforce to identify priority customer segments and positioning opportunities.',
            'Generate a refined report after knowledge sources have processed.',
          ],
        },
      },
    ];
  }

  private parseSections(
    content: string,
    provider: string,
    model: string,
  ): Array<{ title: string; kind: string; content: unknown }> {
    try {
      const parsed = JSON.parse(content) as {
        sections?: Array<{ title?: string; kind?: string; content?: unknown }>;
      };

      if (parsed.sections?.length) {
        return parsed.sections.map((section, index) => ({
          title: section.title || `Section ${index + 1}`,
          kind: section.kind || 'narrative',
          content: section.content ?? { text: '' },
        }));
      }
    } catch {
      // Fall through to a single text section when the model returns prose.
    }

    return [
      {
        title: 'Executive Summary',
        kind: 'narrative',
        content: {
          text: content,
          generatedBy: provider,
          model,
        },
      },
    ];
  }
}
