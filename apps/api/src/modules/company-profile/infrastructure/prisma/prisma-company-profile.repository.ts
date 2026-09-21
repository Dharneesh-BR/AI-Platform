import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProjectLifecycleState } from '@prisma/client';
import type { AuthenticatedUser } from '../../../../common/auth';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type {
  CompanyProfileRepository,
  UpdateCompanyProfileInput,
} from '../../application/ports/company-profile.repository';
import type { CompanyProfileEntity } from '../../domain/entities/company-profile.entity';

@Injectable()
export class PrismaCompanyProfileRepository implements CompanyProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLatestForProject(
    organizationId: string,
    projectId: string,
    _actor: AuthenticatedUser,
  ): Promise<CompanyProfileEntity | null> {
    const profile = await this.prisma.companyProfile.findFirst({
      where: {
        organizationId,
        projectId,
        deletedAt: null,
      },
      orderBy: {
        version: 'desc',
      },
    });

    return profile ? this.mapProfile(profile) : null;
  }

  async updateDraft(input: UpdateCompanyProfileInput): Promise<CompanyProfileEntity> {
    const existing = await this.prisma.companyProfile.findFirst({
      where: {
        id: input.profileId,
        organizationId: input.organizationId,
        projectId: input.projectId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Company profile not found.');
    }

    const draftProfile = existing.isApproved
      ? await this.createNextVersion(input, existing.version)
      : await this.prisma.companyProfile.update({
          where: { id: input.profileId },
          data: this.toUpdateData(input),
        });

    return this.mapProfile(draftProfile);
  }

  async approve(
    organizationId: string,
    projectId: string,
    profileId: string,
    actor: AuthenticatedUser,
  ): Promise<CompanyProfileEntity> {
    const profile = await this.prisma.companyProfile.update({
      where: { id: profileId },
      data: {
        isApproved: true,
        approvedAt: new Date(),
        updatedBy: actor.id,
      },
    });

    if (profile.organizationId !== organizationId || profile.projectId !== projectId) {
      throw new NotFoundException('Company profile not found.');
    }

    await this.prisma.project.updateMany({
      where: {
        id: projectId,
        organizationId,
        deletedAt: null,
        lifecycleState: {
          in: [ProjectLifecycleState.DISCOVERY_COMPLETED, ProjectLifecycleState.KNOWLEDGE_READY],
        },
      },
      data: {
        lifecycleState: ProjectLifecycleState.KNOWLEDGE_READY,
        updatedBy: actor.id,
      },
    });

    return this.mapProfile(profile);
  }

  private async createNextVersion(
    input: UpdateCompanyProfileInput,
    currentVersion: number,
  ) {
    return this.prisma.companyProfile.create({
      data: {
        tenantId: input.organizationId,
        organizationId: input.organizationId,
        projectId: input.projectId,
        version: currentVersion + 1,
        isApproved: false,
        mission: input.mission,
        vision: input.vision,
        industry: input.industry,
        targetCustomers: this.toJsonArray(input.targetCustomers),
        products: this.toJsonArray(input.products),
        services: this.toJsonArray(input.services),
        painPoints: this.toJsonArray(input.painPoints),
        uniqueSellingProposition: input.uniqueSellingProposition,
        createdBy: input.actor.id,
        updatedBy: input.actor.id,
      },
    });
  }

  private toUpdateData(input: UpdateCompanyProfileInput): Prisma.CompanyProfileUpdateInput {
    return {
      mission: input.mission,
      vision: input.vision,
      industry: input.industry,
      targetCustomers: input.targetCustomers ? this.toJsonArray(input.targetCustomers) : undefined,
      products: input.products ? this.toJsonArray(input.products) : undefined,
      services: input.services ? this.toJsonArray(input.services) : undefined,
      painPoints: input.painPoints ? this.toJsonArray(input.painPoints) : undefined,
      uniqueSellingProposition: input.uniqueSellingProposition,
      updatedBy: input.actor.id,
    };
  }

  private mapProfile(profile: {
    id: string;
    projectId: string;
    version: number;
    isApproved: boolean;
    mission: string | null;
    vision: string | null;
    industry: string | null;
    targetCustomers: unknown;
    products: unknown;
    services: unknown;
    painPoints: unknown;
    uniqueSellingProposition: string | null;
    summaries?: unknown;
    sourceMetadata?: unknown;
  }): CompanyProfileEntity {
    return {
      id: profile.id,
      projectId: profile.projectId,
      version: profile.version,
      isApproved: profile.isApproved,
      mission: profile.mission,
      vision: profile.vision,
      industry: profile.industry,
      targetCustomers: this.asStringArray(profile.targetCustomers),
      products: this.asStringArray(profile.products),
      services: this.asStringArray(profile.services),
      painPoints: this.asStringArray(profile.painPoints),
      uniqueSellingProposition: profile.uniqueSellingProposition,
      summaries: this.asRecord(profile.summaries),
      sourceMetadata: this.asRecord(profile.sourceMetadata),
    };
  }

  private asStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  }

  private toJsonArray(value: string[] | undefined): Prisma.InputJsonValue {
    return Array.isArray(value) ? value : [];
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  }
}
