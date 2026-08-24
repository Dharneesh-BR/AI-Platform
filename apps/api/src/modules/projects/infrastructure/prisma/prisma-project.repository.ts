import { ForbiddenException, Injectable } from '@nestjs/common';
import { MembershipStatus, PlatformRole as PrismaPlatformRole, ProjectLifecycleState as PrismaProjectLifecycleState, type Project } from '@prisma/client';
import { getProjectRouteForLifecycle, ProjectLifecycleState } from '@platform/domain';
import { PlatformRole, type AuthenticatedUser } from '../../../../common/auth';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { ProjectEntity } from '../../domain/entities/project.entity';
import type { CreateProjectInput, ProjectRepository, UpdateProjectInput } from '../../domain/repositories/project.repository';

@Injectable()
export class PrismaProjectRepository implements ProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateProjectInput): Promise<ProjectEntity> {
    await this.ensureProjectAccess(input.organizationId, input.actor, true);
    const project = await this.prisma.project.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        slug: input.slug,
        description: input.description,
        lifecycleState: PrismaProjectLifecycleState.CREATED,
        createdBy: input.actor.id,
        updatedBy: input.actor.id,
      },
    });

    return this.mapProject(project);
  }

  async list(organizationId: string, actor: AuthenticatedUser): Promise<ProjectEntity[]> {
    await this.ensureProjectAccess(organizationId, actor, false);
    const projects = await this.prisma.project.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map((project) => this.mapProject(project));
  }

  async findById(
    organizationId: string,
    projectId: string,
    actor: AuthenticatedUser,
  ): Promise<ProjectEntity | null> {
    await this.ensureProjectAccess(organizationId, actor, false);
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId, deletedAt: null },
    });

    return project ? this.mapProject(project) : null;
  }

  async update(input: UpdateProjectInput): Promise<ProjectEntity> {
    await this.ensureProjectAccess(input.organizationId, input.actor, true);
    const project = await this.prisma.project.update({
      where: { id: input.projectId },
      data: {
        name: input.name,
        description: input.description,
        updatedBy: input.actor.id,
      },
    });

    return this.mapProject(project);
  }

  async softDelete(
    organizationId: string,
    projectId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.ensureProjectAccess(organizationId, actor, true);
    await this.prisma.project.update({
      where: { id: projectId },
      data: { deletedAt: new Date(), updatedBy: actor.id },
    });
  }

  private async ensureProjectAccess(
    organizationId: string,
    actor: AuthenticatedUser,
    requireWrite: boolean,
  ): Promise<void> {
    if (actor.roles.includes(PlatformRole.SuperAdmin)) {
      return;
    }

    const allowedRoles = requireWrite
      ? [PrismaPlatformRole.ADMIN, PrismaPlatformRole.CONSULTANT]
      : [PrismaPlatformRole.ADMIN, PrismaPlatformRole.CONSULTANT, PrismaPlatformRole.CLIENT, PrismaPlatformRole.VIEWER];

    const membership = await this.prisma.organizationMembership.findFirst({
      where: {
        organizationId,
        userId: actor.id,
        role: { in: allowedRoles },
        status: MembershipStatus.ACTIVE,
        deletedAt: null,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have project access in this organization.');
    }
  }

  private mapProject(project: Project): ProjectEntity {
    const lifecycleState = project.lifecycleState as ProjectLifecycleState;
    return {
      id: project.id,
      organizationId: project.organizationId,
      name: project.name,
      slug: project.slug,
      description: project.description,
      status: project.status,
      lifecycleState,
      metadata:
        project.metadata && typeof project.metadata === 'object' && !Array.isArray(project.metadata)
          ? project.metadata
          : {},
      nextRoute: getProjectRouteForLifecycle(lifecycleState, project.id),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      deletedAt: project.deletedAt,
      createdBy: project.createdBy,
      updatedBy: project.updatedBy,
    };
  }
}