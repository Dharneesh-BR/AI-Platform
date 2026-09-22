import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';

@Injectable()
export class AgentContextService {
  constructor(private readonly prisma: PrismaService) {}

  async buildCompanyContext(input: { projectId: string; userId: string }): Promise<string> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: input.projectId,
        createdBy: input.userId,
        deletedAt: null,
      },
      include: {
        projectProfile: true,
        companyProfiles: { orderBy: { version: 'desc' }, take: 1 },
        reports: {
          where: { deletedAt: null },
          include: { sections: { orderBy: { ordinal: 'asc' }, take: 8 } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        researchSources: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const approvedProfile = project.companyProfiles[0];
    const latestReport = project.reports[0];

    return [
      `Project: ${project.name}`,
      `Description: ${project.description ?? 'Not provided'}`,
      `Company: ${project.projectProfile?.companyName ?? 'Not completed'}`,
      `Industry: ${approvedProfile?.industry ?? project.projectProfile?.industry ?? 'Not provided'}`,
      `Target market: ${project.projectProfile?.targetMarket ?? JSON.stringify(approvedProfile?.targetCustomers ?? [])}`,
      `Business goals: ${JSON.stringify(project.projectProfile?.businessGoals ?? [])}`,
      `Primary challenges: ${JSON.stringify(project.projectProfile?.primaryChallenges ?? [])}`,
      `Approved company profile: ${
        approvedProfile
          ? JSON.stringify({
              mission: approvedProfile.mission,
              vision: approvedProfile.vision,
              products: approvedProfile.products,
              services: approvedProfile.services,
              painPoints: approvedProfile.painPoints,
              usp: approvedProfile.uniqueSellingProposition,
            })
          : 'Not approved yet'
      }`,
      `Latest readiness report: ${
        latestReport
          ? JSON.stringify({
              title: latestReport.title,
              status: latestReport.status,
              sections: latestReport.sections.map((section) => ({
                title: section.title,
                kind: section.kind,
                content: section.content,
              })),
            }).slice(0, 3000)
          : 'No report yet'
      }`,
      `Knowledge sources: ${project.researchSources
        .map((source) => `${source.title}: ${JSON.stringify(source.content).slice(0, 500)}`)
        .join('\n') || 'No manual knowledge sources yet.'}`,
    ].join('\n\n');
  }
}
