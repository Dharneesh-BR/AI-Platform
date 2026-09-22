import { Injectable, NotFoundException } from '@nestjs/common';
import { ResearchStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../../../common/auth';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LiteLlmGatewayService } from '../../ai/application/services/litellm-gateway.service';

export interface CreateResearchPlanInput {
  projectId: string;
  actor: AuthenticatedUser;
  title: string;
  question: string;
  objectives?: string[];
}

interface GeneratedResearchPlan {
  steps: string[];
  findings: Array<{
    title: string;
    summary: string;
    confidence?: number;
    evidence?: string[];
  }>;
  citations: Array<{
    title?: string;
    source: string;
    url?: string;
    excerpt?: string;
  }>;
  validation: {
    passed: boolean;
    score?: number;
    issues: string[];
  };
}

@Injectable()
export class ResearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly liteLlmGateway: LiteLlmGatewayService,
  ) {}

  async listPlans(projectId: string, actor: AuthenticatedUser) {
    await this.ensureProject(projectId, actor.id);

    return this.prisma.researchPlan.findMany({
      where: { projectId, deletedAt: null, project: { createdBy: actor.id, deletedAt: null } },
      include: { findings: true, citations: true, validations: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPlan(input: CreateResearchPlanInput) {
    const project = await this.ensureProject(input.projectId, input.actor.id);
    const generated = await this.generateResearchPlan(input, project);

    return this.prisma.researchPlan.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        question: input.question,
        objectives: input.objectives ?? [],
        status: ResearchStatus.COMPLETED,
        plan: {
          steps: generated.steps,
          generatedBy: 'ai-research-api',
        },
        createdBy: input.actor.id,
        updatedBy: input.actor.id,
        findings: {
          create: generated.findings.map((finding) => ({
            title: finding.title,
            summary: finding.summary,
            confidence: finding.confidence?.toFixed(4),
            evidence: finding.evidence ?? [],
            createdBy: input.actor.id,
            updatedBy: input.actor.id,
          })),
        },
        citations: {
          create: generated.citations.map((citation) => ({
            title: citation.title,
            source: citation.source,
            url: citation.url,
            excerpt: citation.excerpt,
            retrievedAt: new Date(),
            metadata: { generatedBy: 'ai-research-api' },
            createdBy: input.actor.id,
            updatedBy: input.actor.id,
          })),
        },
        validations: {
          create: {
            passed: generated.validation.passed,
            score: generated.validation.score?.toFixed(4),
            issues: generated.validation.issues,
            createdBy: input.actor.id,
            updatedBy: input.actor.id,
          },
        },
      },
      include: { findings: true, citations: true, validations: true },
    });
  }

  async getPlan(projectId: string, researchPlanId: string, actor: AuthenticatedUser) {
    await this.ensureProject(projectId, actor.id);

    const plan = await this.prisma.researchPlan.findFirst({
      where: { id: researchPlanId, projectId, deletedAt: null, project: { createdBy: actor.id, deletedAt: null } },
      include: { findings: true, citations: true, validations: true },
    });

    if (!plan) {
      throw new NotFoundException('Research plan not found.');
    }

    return plan;
  }

  private async ensureProject(projectId: string, actorUserId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, createdBy: actorUserId, deletedAt: null },
      include: {
        projectProfile: true,
        companyProfiles: {
          where: { isApproved: true },
          take: 1,
          orderBy: { version: 'desc' },
        },
        researchSources: {
          where: { deletedAt: null },
          take: 8,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    return project;
  }

  private async generateResearchPlan(
    input: CreateResearchPlanInput,
    project: Awaited<ReturnType<ResearchService['ensureProject']>>,
  ): Promise<GeneratedResearchPlan> {
    const aiResult = await this.liteLlmGateway.generateText({
      temperature: 0.2,
      maxTokens: 1300,
      metadata: {
        feature: 'research-plan',
        projectId: input.projectId,
      },
      messages: [
        {
          role: 'system',
          content:
            'You are a senior strategy research analyst. Return strict JSON only with this shape: ' +
            '{"steps":["string"],"findings":[{"title":"string","summary":"string","confidence":0.8,"evidence":["string"]}],"citations":[{"title":"string","source":"string","url":"string","excerpt":"string"}],"validation":{"passed":true,"score":0.8,"issues":["string"]}}. ' +
            'If external sources are not available, cite internal project/company context as the source.',
        },
        {
          role: 'user',
          content: [
            `Research title: ${input.title}`,
            `Research question: ${input.question}`,
            `Objectives: ${(input.objectives ?? []).join(', ') || 'Not provided'}`,
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
          ].join('\n\n'),
        },
      ],
    });

    return this.parseGeneratedResearch(aiResult.content);
  }

  private parseGeneratedResearch(content: string): GeneratedResearchPlan {
    try {
      const parsed = JSON.parse(content) as Partial<GeneratedResearchPlan>;

      return {
        steps: parsed.steps?.length
          ? parsed.steps
          : ['Clarify question', 'Review approved context', 'Draft findings', 'Validate recommendation'],
        findings: parsed.findings?.length
          ? parsed.findings
          : [{ title: 'Initial finding', summary: content, confidence: 0.6, evidence: ['AI-generated synthesis'] }],
        citations: parsed.citations?.length
          ? parsed.citations
          : [{ source: 'Project context', excerpt: 'Generated from available internal project context.' }],
        validation: parsed.validation ?? {
          passed: true,
          score: 0.7,
          issues: ['Needs human review before stakeholder use.'],
        },
      };
    } catch {
      return {
        steps: ['Clarify question', 'Review approved context', 'Draft findings', 'Validate recommendation'],
        findings: [
          {
            title: 'AI research synthesis',
            summary: content,
            confidence: 0.6,
            evidence: ['Generated from available project context.'],
          },
        ],
        citations: [{ source: 'Project context', excerpt: 'Generated from available internal project context.' }],
        validation: {
          passed: true,
          score: 0.7,
          issues: ['Needs human review before stakeholder use.'],
        },
      };
    }
  }
}
