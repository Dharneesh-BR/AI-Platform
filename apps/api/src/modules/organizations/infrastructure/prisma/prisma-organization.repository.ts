import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  MembershipStatus as PrismaMembershipStatus,
  PlatformRole as PrismaPlatformRole,
  type Organization,
  type OrganizationMembership,
} from '@prisma/client';
import { PlatformRole, type AuthenticatedUser } from '../../../../common/auth';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { OrganizationEntity } from '../../domain/entities/organization.entity';
import {
  OrganizationMembershipStatus,
  type OrganizationMembershipEntity,
} from '../../domain/entities/organization-membership.entity';
import type {
  AddOrganizationMembershipInput,
  CreateOrganizationInput,
  OrganizationRepository,
  UpdateOrganizationInput,
  UpdateOrganizationMembershipInput,
} from '../../domain/repositories/organization.repository';

@Injectable()
export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateOrganizationInput): Promise<OrganizationEntity> {
    const organization = await this.prisma.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        createdBy: input.actor.id,
        updatedBy: input.actor.id,
        memberships: {
          create: {
            userId: input.actor.id,
            role: PrismaPlatformRole.ADMIN,
            status: PrismaMembershipStatus.ACTIVE,
            joinedAt: new Date(),
            createdBy: input.actor.id,
            updatedBy: input.actor.id,
          },
        },
      },
    });

    return this.mapOrganization(organization);
  }

  async listForUser(actor: AuthenticatedUser): Promise<OrganizationEntity[]> {
    const organizations = await this.prisma.organization.findMany({
      where: this.isSuperAdmin(actor)
        ? { deletedAt: null }
        : {
            deletedAt: null,
            memberships: {
              some: {
                userId: actor.id,
                status: PrismaMembershipStatus.ACTIVE,
                deletedAt: null,
              },
            },
          },
      orderBy: { createdAt: 'desc' },
    });

    return organizations.map((organization) => this.mapOrganization(organization));
  }

  async findById(id: string, actor: AuthenticatedUser): Promise<OrganizationEntity | null> {
    await this.ensureReadable(id, actor);
    const organization = await this.prisma.organization.findFirst({
      where: { id, deletedAt: null },
    });

    return organization ? this.mapOrganization(organization) : null;
  }

  async update(input: UpdateOrganizationInput): Promise<OrganizationEntity> {
    await this.ensureManageable(input.id, input.actor);
    const organization = await this.prisma.organization.update({
      where: { id: input.id },
      data: {
        name: input.name,
        description: input.description,
        updatedBy: input.actor.id,
      },
    });

    return this.mapOrganization(organization);
  }

  async softDelete(id: string, actor: AuthenticatedUser): Promise<void> {
    await this.ensureManageable(id, actor);
    await this.prisma.organization.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: actor.id,
      },
    });
  }

  async addMembership(
    input: AddOrganizationMembershipInput,
  ): Promise<OrganizationMembershipEntity> {
    await this.ensureManageable(input.organizationId, input.actor);
    const membership = await this.prisma.organizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: input.organizationId,
          userId: input.userId,
        },
      },
      create: {
        organizationId: input.organizationId,
        userId: input.userId,
        role: this.toPrismaRole(input.role),
        status: PrismaMembershipStatus.INVITED,
        invitedAt: new Date(),
        createdBy: input.actor.id,
        updatedBy: input.actor.id,
      },
      update: {
        role: this.toPrismaRole(input.role),
        status: PrismaMembershipStatus.INVITED,
        invitedAt: new Date(),
        deletedAt: null,
        updatedBy: input.actor.id,
      },
    });

    return this.mapMembership(membership);
  }

  async updateMembership(
    input: UpdateOrganizationMembershipInput,
  ): Promise<OrganizationMembershipEntity> {
    await this.ensureManageable(input.organizationId, input.actor);
    const membership = await this.prisma.organizationMembership.update({
      where: { id: input.membershipId },
      data: {
        role: input.role ? this.toPrismaRole(input.role) : undefined,
        status: input.status ? this.toPrismaMembershipStatus(input.status) : undefined,
        joinedAt: input.status === OrganizationMembershipStatus.Active ? new Date() : undefined,
        updatedBy: input.actor.id,
      },
    });

    if (membership.organizationId !== input.organizationId) {
      throw new NotFoundException('Organization membership not found.');
    }

    return this.mapMembership(membership);
  }

  private async ensureReadable(organizationId: string, actor: AuthenticatedUser): Promise<void> {
    if (this.isSuperAdmin(actor)) {
      return;
    }

    const membership = await this.prisma.organizationMembership.findFirst({
      where: {
        organizationId,
        userId: actor.id,
        status: PrismaMembershipStatus.ACTIVE,
        deletedAt: null,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this organization.');
    }
  }

  private async ensureManageable(organizationId: string, actor: AuthenticatedUser): Promise<void> {
    if (this.isSuperAdmin(actor)) {
      return;
    }

    const membership = await this.prisma.organizationMembership.findFirst({
      where: {
        organizationId,
        userId: actor.id,
        role: PrismaPlatformRole.ADMIN,
        status: PrismaMembershipStatus.ACTIVE,
        deletedAt: null,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You need organization admin access for this operation.');
    }
  }

  private isSuperAdmin(actor: AuthenticatedUser): boolean {
    return actor.roles.includes(PlatformRole.SuperAdmin);
  }

  private mapOrganization(organization: Organization): OrganizationEntity {
    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      description: organization.description,
      settings:
        organization.settings && typeof organization.settings === 'object' && !Array.isArray(organization.settings)
          ? organization.settings
          : {},
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      deletedAt: organization.deletedAt,
      createdBy: organization.createdBy,
      updatedBy: organization.updatedBy,
    };
  }

  private mapMembership(membership: OrganizationMembership): OrganizationMembershipEntity {
    return {
      id: membership.id,
      organizationId: membership.organizationId,
      userId: membership.userId,
      role: this.fromPrismaRole(membership.role),
      status: this.fromPrismaMembershipStatus(membership.status),
      invitedAt: membership.invitedAt,
      joinedAt: membership.joinedAt,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
      deletedAt: membership.deletedAt,
      createdBy: membership.createdBy,
      updatedBy: membership.updatedBy,
    };
  }

  private toPrismaRole(role: PlatformRole): PrismaPlatformRole {
    const roleMap: Record<PlatformRole, PrismaPlatformRole> = {
      [PlatformRole.SuperAdmin]: PrismaPlatformRole.SUPER_ADMIN,
      [PlatformRole.Admin]: PrismaPlatformRole.ADMIN,
      [PlatformRole.Consultant]: PrismaPlatformRole.CONSULTANT,
      [PlatformRole.Client]: PrismaPlatformRole.CLIENT,
      [PlatformRole.Viewer]: PrismaPlatformRole.VIEWER,
    };

    return roleMap[role];
  }

  private fromPrismaRole(role: PrismaPlatformRole): PlatformRole {
    const roleMap: Record<PrismaPlatformRole, PlatformRole> = {
      SUPER_ADMIN: PlatformRole.SuperAdmin,
      ADMIN: PlatformRole.Admin,
      CONSULTANT: PlatformRole.Consultant,
      CLIENT: PlatformRole.Client,
      VIEWER: PlatformRole.Viewer,
    };

    return roleMap[role];
  }

  private toPrismaMembershipStatus(status: string): PrismaMembershipStatus {
    const statusMap: Record<string, PrismaMembershipStatus> = {
      [OrganizationMembershipStatus.Invited]: PrismaMembershipStatus.INVITED,
      [OrganizationMembershipStatus.Active]: PrismaMembershipStatus.ACTIVE,
      [OrganizationMembershipStatus.Suspended]: PrismaMembershipStatus.SUSPENDED,
      [OrganizationMembershipStatus.Removed]: PrismaMembershipStatus.REMOVED,
    };

    return statusMap[status] ?? PrismaMembershipStatus.INVITED;
  }

  private fromPrismaMembershipStatus(status: PrismaMembershipStatus): OrganizationMembershipStatus {
    const statusMap: Record<PrismaMembershipStatus, OrganizationMembershipStatus> = {
      INVITED: OrganizationMembershipStatus.Invited,
      ACTIVE: OrganizationMembershipStatus.Active,
      SUSPENDED: OrganizationMembershipStatus.Suspended,
      REMOVED: OrganizationMembershipStatus.Removed,
    };

    return statusMap[status];
  }
}