import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProjectLifecycleState, ReportStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../../../common/auth';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LiteLlmGatewayService } from '../../ai/application/services/litellm-gateway.service';

export interface CreateReportInput {
  projectId: string;
  actor: AuthenticatedUser;
  title: string;
  sections?: Array<{ title: string; kind: string; content: unknown }>;
}

interface ReportSectionDraft {
  title: string;
  kind: string;
  content: {
    text: string;
    bullets: string[];
  };
}

interface GeneratedReportDraft {
  sections: ReportSectionDraft[];
  metadata: Record<string, unknown>;
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

    const generated = input.sections?.length
      ? {
          sections: input.sections.map((section) => this.normalizeSection(section)),
          metadata: {
            generatedBy: 'manual-api',
            aiUsed: false,
            sourceCount: project.researchSources.length,
          },
        }
      : await this.generateReportSections(input, project);

    return this.prisma.report.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        status: ReportStatus.READY,
        metadata: generated.metadata as Prisma.InputJsonValue,
        createdBy: input.actor.id,
        updatedBy: input.actor.id,
        sections: {
          create: generated.sections.map((section, index) => ({
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
  ): Promise<GeneratedReportDraft> {
    const sourceSummaries = this.sourceSummaries(project);
    const profile = project.companyProfiles[0];
    try {
      const aiResult = await this.liteLlmGateway.generateText({
        temperature: 0.25,
        maxTokens: 1800,
        metadata: {
          feature: 'report-generation',
          projectId: input.projectId,
        },
        messages: [
          {
            role: 'system',
            content: [
              'You generate concise stakeholder-ready consulting reports grounded only in supplied project context.',
              'Return strict JSON only. Do not wrap in Markdown.',
              'Use these exact section titles when possible: Executive Summary, Key Findings, Priority Opportunities, 30-Day Roadmap, Risks and Assumptions.',
              'Each section must have content.text and 3-5 specific content.bullets.',
              'Never return schema placeholders such as "string", ["string"], example, sample, n/a, or not provided.',
              'Mention knowledge-source evidence when relevant, especially customer support, warranty, service, product, or growth notes.',
              'Shape keys: sections[].title, sections[].kind, sections[].content.text, sections[].content.bullets.',
            ].join('\n'),
          },
          {
            role: 'user',
            content: [
              `Report title: ${input.title}`,
              `Project: ${project.name}`,
              `Project description: ${project.description ?? 'Not provided'}`,
              `Onboarding profile: ${JSON.stringify(project.projectProfile ?? {})}`,
              `Approved company profile: ${JSON.stringify(profile ?? {})}`,
              `Knowledge sources: ${JSON.stringify(sourceSummaries)}`,
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

      return {
        sections: this.parseSections(aiResult.content),
        metadata: {
          generatedBy: 'ai-report-api',
          aiUsed: true,
          provider: aiResult.provider,
          model: aiResult.model,
          sourceCount: sourceSummaries.length,
          sourceTitles: sourceSummaries.map((source) => source.title),
          companyProfileId: profile?.id ?? null,
          disclosure: 'This report was AI-assisted and generated from the approved company profile, onboarding context, project knowledge sources, and available research context.',
        },
      };
    } catch {
      return {
        sections: this.fallbackSections(project),
        metadata: {
          generatedBy: 'fallback-report-generator',
          aiUsed: false,
          sourceCount: sourceSummaries.length,
          sourceTitles: sourceSummaries.map((source) => source.title),
          companyProfileId: profile?.id ?? null,
          disclosure: 'This report used deterministic fallback generation from the approved company profile, onboarding context, and project knowledge sources because AI generation was unavailable.',
        },
      };
    }
  }

  private fallbackSections(
    project: Awaited<ReturnType<ReportsService['ensureProject']>>,
  ): ReportSectionDraft[] {
    const profile = project.companyProfiles[0];
    const onboarding = project.projectProfile;
    const goals = Array.isArray(onboarding?.businessGoals) ? onboarding.businessGoals : [];
    const challenges = Array.isArray(onboarding?.primaryChallenges) ? onboarding.primaryChallenges : [];
    const products = Array.isArray(profile?.products) ? profile.products : [];
    const services = Array.isArray(profile?.services) ? profile.services : [];
    const sourceSummaries = this.sourceSummaries(project);
    const sourceBullets = sourceSummaries
      .flatMap((source) => this.contentBullets(source.content))
      .slice(0, 5);

    return [
      {
        title: 'Executive Summary',
        kind: 'narrative',
        content: {
          text: `${project.name} has an AI-ready workspace with approved company context and ${sourceSummaries.length} project knowledge source${sourceSummaries.length === 1 ? '' : 's'} available for strategy work.`,
          bullets: [
            onboarding?.companyName ? `Company context captured for ${onboarding.companyName}.` : 'Company context is ready for refinement.',
            profile?.industry || onboarding?.industry ? `Industry context: ${profile?.industry ?? onboarding?.industry}.` : 'Industry context can be enriched during onboarding.',
            sourceSummaries.length ? `Knowledge used: ${sourceSummaries.map((source) => source.title).join(', ')}.` : 'No project knowledge sources were available at generation time.',
          ],
        },
      },
      {
        title: 'Key Findings',
        kind: 'findings',
        content: {
          text: 'This section summarizes the current business context and knowledge signals.',
          bullets: [
            ...goals.slice(0, 4).map((goal) => `Goal: ${String(goal)}`),
            ...challenges.slice(0, 4).map((challenge) => `Challenge: ${String(challenge)}`),
            ...sourceBullets,
          ].slice(0, 8),
        },
      },
      {
        title: 'Priority Opportunities',
        kind: 'findings',
        content: {
          text: 'These opportunities are derived from the approved profile and available knowledge sources.',
          bullets: [
            ...products.slice(0, 3).map((product) => `Product: ${String(product)}`),
            ...services.slice(0, 3).map((service) => `Service: ${String(service)}`),
            sourceBullets.length ? 'Use project knowledge signals to prioritize support automation and self-service improvements.' : 'Add more customer and operational knowledge to sharpen opportunity prioritization.',
          ].slice(0, 8),
        },
      },
      {
        title: '30-Day Roadmap',
        kind: 'roadmap',
        content: {
          text: 'Use the next 30 days to convert setup into evidence-backed decisions and measurable improvements.',
          bullets: [
            'Week 1: validate support, customer, product, and growth themes with internal stakeholders.',
            'Week 2: convert repeated support issues into knowledge-base and chat automation flows.',
            'Week 3: test AI-assisted answers against common customer questions and escalation scenarios.',
            'Week 4: review answer quality, update source material, and publish operating recommendations.',
          ],
        },
      },
      {
        title: 'Risks and Assumptions',
        kind: 'risks',
        content: {
          text: 'The report should be treated as a first-pass AI-assisted strategy artifact.',
          bullets: [
            'Recommendations depend on the quality and freshness of approved project knowledge.',
            'Any customer-facing automation should be reviewed before publishing.',
            'Financial or operational impact estimates require validated internal data.',
          ],
        },
      },
    ];
  }

  private parseSections(content: string): ReportSectionDraft[] {
    try {
      const parsed = JSON.parse(content) as {
        sections?: Array<{ title?: string; kind?: string; content?: unknown }>;
      };

      if (parsed.sections?.length) {
        const sections = parsed.sections.map((section, index) => this.normalizeSection({
          title: section.title || `Section ${index + 1}`,
          kind: section.kind || 'narrative',
          content: section.content ?? { text: '' },
        })).filter((section) => section.content.text || section.content.bullets.length);

        if (sections.length) {
          return this.ensureReportShape(sections);
        }
      }
    } catch {
      // Fall through to a single text section when the model returns prose.
    }

    return this.ensureReportShape([this.normalizeSection({
      title: 'Executive Summary',
      kind: 'narrative',
      content: { text: content },
    })]);
  }

  private normalizeSection(section: { title?: string; kind?: string; content?: unknown }): ReportSectionDraft {
    const content = this.asRecord(section.content);
    const text = this.cleanReportText(typeof content.text === 'string' ? content.text : '');
    const bullets = Array.isArray(content.bullets)
      ? content.bullets
          .filter((bullet): bullet is string => typeof bullet === 'string')
          .map((bullet) => this.cleanReportText(bullet))
          .filter(Boolean)
          .slice(0, 6)
      : [];

    return {
      title: this.cleanReportText(section.title ?? '') || 'Report Section',
      kind: this.cleanReportText(section.kind ?? '') || 'narrative',
      content: { text, bullets },
    };
  }

  private ensureReportShape(sections: ReportSectionDraft[]): ReportSectionDraft[] {
    const required = [
      { title: 'Executive Summary', kind: 'narrative' },
      { title: 'Key Findings', kind: 'findings' },
      { title: 'Priority Opportunities', kind: 'findings' },
      { title: '30-Day Roadmap', kind: 'roadmap' },
      { title: 'Risks and Assumptions', kind: 'risks' },
    ];

    return required.map((fallback) =>
      sections.find((section) => section.title.toLowerCase() === fallback.title.toLowerCase()) ?? {
        ...fallback,
        content: {
          text: `${fallback.title} will be refined as more project context is added.`,
          bullets: ['Review approved profile and knowledge sources before sharing externally.'],
        },
      },
    );
  }

  private sourceSummaries(project: Awaited<ReturnType<ReportsService['ensureProject']>>) {
    return project.researchSources.map((source) => ({
      title: source.title,
      type: source.type,
      content: this.extractContentText(source.content).slice(0, 1200),
    }));
  }

  private extractContentText(content: unknown): string {
    if (typeof content === 'string') {
      return content;
    }

    const record = this.asRecord(content);
    if (typeof record.text === 'string') {
      return record.text;
    }
    if (typeof record.summary === 'string') {
      return record.summary;
    }
    return '';
  }

  private contentBullets(content: string): string[] {
    return content
      .split(/[.!?]\s+/)
      .map((sentence) => this.cleanReportText(sentence))
      .filter((sentence) => sentence.length >= 24)
      .map((sentence) => `Knowledge signal: ${sentence}.`);
  }

  private cleanReportText(value: string): string {
    const cleaned = value.replace(/\s+/g, ' ').trim();
    return this.isPlaceholderText(cleaned) ? '' : cleaned;
  }

  private isPlaceholderText(value: string): boolean {
    const normalized = value
      .trim()
      .toLowerCase()
      .replace(/[{}[\]"'`]/g, '')
      .replace(/\s+/g, ' ');

    return [
      'string',
      'strings',
      'string, string',
      'array of strings',
      'example',
      'sample',
      'placeholder',
      'n/a',
      'na',
      'none',
      'null',
      'undefined',
      'not provided',
    ].includes(normalized);
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  }
}
