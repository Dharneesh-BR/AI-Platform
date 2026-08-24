import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportStatus } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

export interface CreateReportInput {
  organizationId: string;
  projectId: string;
  actorUserId: string;
  title: string;
  sections?: Array<{ title: string; kind: string; content: unknown }>;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProjectReports(organizationId: string, projectId: string) {
    await this.ensureProject(organizationId, projectId);

    return this.prisma.report.findMany({
      where: { organizationId, projectId, deletedAt: null },
      include: { sections: { orderBy: { ordinal: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReport(input: CreateReportInput) {
    await this.ensureProject(input.organizationId, input.projectId);

    const sections = input.sections?.length
      ? input.sections
      : [
          {
            title: 'Executive Summary',
            kind: 'narrative',
            content: {
              text: 'Generated report draft based on approved company context and research plan.',
            },
          },
        ];

    return this.prisma.report.create({
      data: {
        organizationId: input.organizationId,
        projectId: input.projectId,
        title: input.title,
        status: ReportStatus.READY,
        metadata: { generatedBy: 'mvp-report-api' },
        createdBy: input.actorUserId,
        updatedBy: input.actorUserId,
        sections: {
          create: sections.map((section, index) => ({
            title: section.title,
            kind: section.kind,
            ordinal: index + 1,
            content: section.content as object,
            createdBy: input.actorUserId,
            updatedBy: input.actorUserId,
          })),
        },
      },
      include: { sections: { orderBy: { ordinal: 'asc' } } },
    });
  }

  async getReport(organizationId: string, reportId: string) {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, organizationId, deletedAt: null },
      include: { sections: { orderBy: { ordinal: 'asc' } }, project: true },
    });

    if (!report) {
      throw new NotFoundException('Report not found.');
    }

    return report;
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