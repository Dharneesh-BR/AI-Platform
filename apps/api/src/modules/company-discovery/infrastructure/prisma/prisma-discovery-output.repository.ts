import { Injectable } from '@nestjs/common';
import { Prisma, ProjectLifecycleState, ResearchSourceType } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type {
  DiscoveryOutputRepository,
  PersistDiscoveryOutputInput,
} from '../../application/ports/discovery-output.repository';

@Injectable()
export class PrismaDiscoveryOutputRepository implements DiscoveryOutputRepository {
  constructor(private readonly prisma: PrismaService) {}

  async persist(input: PersistDiscoveryOutputInput): Promise<{ companyProfileId: string; version: number }> {
    return this.prisma.$transaction(async (transaction) => {
      const latestProfile = await transaction.companyProfile.findFirst({
        where: {
          projectId: input.projectId,
          deletedAt: null,
        },
        orderBy: { version: 'desc' },
        select: { version: true },
      });

      const version = (latestProfile?.version ?? 0) + 1;
      const companyProfile = await transaction.companyProfile.create({
        data: {
          projectId: input.projectId,
          version,
          isApproved: false,
          mission: input.mission,
          vision: input.vision,
          industry: input.industry,
          targetCustomers: input.targetCustomers,
          products: input.products,
          services: input.services,
          painPoints: input.painPoints,
          uniqueSellingProposition: input.uniqueSellingProposition,
          summaries: this.toJsonObject(input.summaries),
          sourceMetadata: this.toJsonObject(input.sourceMetadata),
          createdBy: input.actorUserId,
          updatedBy: input.actorUserId,
        },
      });

      if (input.technologies.length > 0) {
        await transaction.companyTechnology.createMany({
          data: input.technologies.map((technology) => ({
            projectId: input.projectId,
            companyProfileId: companyProfile.id,
            name: technology.name,
            category: technology.category,
            confidence: technology.confidence ? new Prisma.Decimal(technology.confidence) : undefined,
            createdBy: input.actorUserId,
            updatedBy: input.actorUserId,
          })),
        });
      }

      if (input.competitors.length > 0) {
        await transaction.companyCompetitor.createMany({
          data: input.competitors.map((competitor) => ({
            projectId: input.projectId,
            companyProfileId: companyProfile.id,
            name: competitor.name,
            websiteUrl: competitor.websiteUrl,
            positioning: competitor.positioning,
            createdBy: input.actorUserId,
            updatedBy: input.actorUserId,
          })),
        });
      }

      if (input.goals.length > 0) {
        await transaction.companyGoal.createMany({
          data: input.goals.map((goal, index) => ({
            projectId: input.projectId,
            companyProfileId: companyProfile.id,
            title: goal.title,
            description: goal.description,
            priority: (index + 1) * 10,
            createdBy: input.actorUserId,
            updatedBy: input.actorUserId,
          })),
        });
      }

      await transaction.researchSource.create({
        data: {
          projectId: input.projectId,
          type: ResearchSourceType.COMPANY_PROFILE,
          sourceId: companyProfile.id,
          title: `${input.companyName} company discovery profile`,
          content: this.toJsonObject({
            companyName: input.companyName,
            industry: input.industry,
            products: input.products,
            services: input.services,
            targetCustomers: input.targetCustomers,
            painPoints: input.painPoints,
            uniqueSellingProposition: input.uniqueSellingProposition,
            summaries: input.summaries,
          }),
          metadata: this.toJsonObject(input.sourceMetadata),
          createdBy: input.actorUserId,
          updatedBy: input.actorUserId,
        },
      });

      await transaction.project.update({
        where: { id: input.projectId },
        data: {
          lifecycleState: ProjectLifecycleState.DISCOVERY_COMPLETED,
          updatedBy: input.actorUserId,
        },
      });

      return { companyProfileId: companyProfile.id, version };
    });
  }

  private toJsonObject(value: Record<string, unknown>): Prisma.InputJsonValue {
    return value as Prisma.InputJsonObject;
  }
}
