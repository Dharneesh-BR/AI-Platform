import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectLifecycleState } from '@platform/domain';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { ProjectProfileEntity } from '../../domain/entities/project-profile.entity';
import type {
  ProjectProfileRepository,
  UpsertProjectProfileInput,
} from '../../application/ports/project-profile.repository';
import type { AuthenticatedUser } from '../../../../common/auth';

@Injectable()
export class PrismaProjectProfileRepository implements ProjectProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByProjectId(
    organizationId: string,
    projectId: string,
    _actor: AuthenticatedUser,
  ): Promise<ProjectProfileEntity | null> {
    const profile = await this.prisma.projectProfile.findFirst({
      where: {
        organizationId,
        projectId,
        deletedAt: null,
      },
    });

    return profile ? this.mapProfile(profile) : null;
  }

  async findOrCreateDefault(
    organizationId: string,
    projectId: string,
    actor: AuthenticatedUser,
  ): Promise<ProjectProfileEntity> {
    const existing = await this.findByProjectId(organizationId, projectId, actor);

    if (existing) {
      return existing;
    }

    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const profile = await this.prisma.projectProfile.create({
      data: this.defaultProfileData({
        organizationId,
        projectId: project.id,
        actor,
        companyName: project.name,
        businessModel: project.description,
      }),
    });

    return this.mapProfile(profile);
  }

  async upsert(input: UpsertProjectProfileInput): Promise<ProjectProfileEntity> {
    const profile = await this.prisma.projectProfile.upsert({
      where: {
        projectId: input.projectId,
      },
      create: {
        tenantId: input.organizationId,
        organizationId: input.organizationId,
        projectId: input.projectId,
        companyName: input.companyName,
        websiteUrl: input.websiteUrl,
        industry: input.industry,
        companySize: input.companySize,
        businessModel: input.businessModel,
        targetMarket: input.targetMarket,
        businessGoals: this.toJsonArray(input.businessGoals),
        primaryChallenges: this.toJsonArray(input.primaryChallenges),
        competitors: this.toJsonArray(input.competitors),
        documents: this.toJsonArray(input.documents),
        brandGuidelines: this.toJsonArray(input.brandGuidelines),
        strategyDocuments: this.toJsonArray(input.strategyDocuments),
        onboardingStep: input.onboardingStep,
        createdBy: input.actor.id,
        updatedBy: input.actor.id,
      },
      update: {
        companyName: input.companyName,
        websiteUrl: input.websiteUrl,
        industry: input.industry,
        companySize: input.companySize,
        businessModel: input.businessModel,
        targetMarket: input.targetMarket,
        businessGoals: this.toJsonArray(input.businessGoals),
        primaryChallenges: this.toJsonArray(input.primaryChallenges),
        competitors: this.toJsonArray(input.competitors),
        documents: this.toJsonArray(input.documents),
        brandGuidelines: this.toJsonArray(input.brandGuidelines),
        strategyDocuments: this.toJsonArray(input.strategyDocuments),
        onboardingStep: input.onboardingStep,
        updatedBy: input.actor.id,
      },
    });

    await this.prisma.project.updateMany({
      where: {
        id: input.projectId,
        organizationId: input.organizationId,
        lifecycleState: ProjectLifecycleState.Created,
      },
      data: {
        lifecycleState: ProjectLifecycleState.Onboarding,
        updatedBy: input.actor.id,
      },
    });

    return this.mapProfile(profile);
  }

  async complete(
    organizationId: string,
    projectId: string,
    actor: AuthenticatedUser,
  ): Promise<ProjectProfileEntity> {
    const existing = await this.findOrCreateDefault(organizationId, projectId, actor);
    const profile = await this.prisma.projectProfile.update({
      where: {
        id: existing.id,
      },
      data: {
        completedAt: new Date(),
        updatedBy: actor.id,
      },
    });

    return this.mapProfile(profile);
  }

  private defaultProfileData(input: {
    organizationId: string;
    projectId: string;
    actor: AuthenticatedUser;
    companyName: string;
    businessModel?: string | null;
  }): Prisma.ProjectProfileUncheckedCreateInput {
    return {
      tenantId: input.organizationId,
      organizationId: input.organizationId,
      projectId: input.projectId,
      companyName: input.companyName,
      businessModel:
        input.businessModel ??
        'Business workspace for consulting, research, and growth planning.',
      businessGoals: this.toJsonArray([
        'Clarify positioning',
        'Understand customers',
        'Prioritize growth opportunities',
      ]),
      primaryChallenges: this.toJsonArray([
        'Scattered business context',
        'Manual research',
        'Unclear next priorities',
      ]),
      competitors: this.toJsonArray([]),
      documents: this.toJsonArray([]),
      brandGuidelines: this.toJsonArray([]),
      strategyDocuments: this.toJsonArray([]),
      onboardingStep: 'company-basics',
      createdBy: input.actor.id,
      updatedBy: input.actor.id,
    };
  }

  private mapProfile(profile: {
    id: string;
    tenantId: string;
    organizationId: string;
    projectId: string;
    companyName: string;
    websiteUrl: string | null;
    industry: string | null;
    companySize: string | null;
    businessModel: string | null;
    targetMarket: string | null;
    businessGoals: unknown;
    primaryChallenges: unknown;
    competitors: unknown;
    documents: unknown;
    brandGuidelines: unknown;
    strategyDocuments: unknown;
    onboardingStep: string | null;
    completedAt: Date | null;
  }): ProjectProfileEntity {
    return {
      id: profile.id,
      tenantId: profile.tenantId,
      organizationId: profile.organizationId,
      projectId: profile.projectId,
      companyName: profile.companyName,
      websiteUrl: profile.websiteUrl,
      industry: profile.industry,
      companySize: profile.companySize,
      businessModel: profile.businessModel,
      targetMarket: profile.targetMarket,
      businessGoals: this.asStringArray(profile.businessGoals),
      primaryChallenges: this.asStringArray(profile.primaryChallenges),
      competitors: this.asStringArray(profile.competitors),
      documents: this.asArray(profile.documents),
      brandGuidelines: this.asArray(profile.brandGuidelines),
      strategyDocuments: this.asArray(profile.strategyDocuments),
      onboardingStep: profile.onboardingStep,
      completedAt: profile.completedAt,
    };
  }

  private asStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  }

  private asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private toJsonArray(value: unknown[] | undefined): Prisma.InputJsonValue {
    return Array.isArray(value) ? (value as Prisma.InputJsonArray) : [];
  }
}
