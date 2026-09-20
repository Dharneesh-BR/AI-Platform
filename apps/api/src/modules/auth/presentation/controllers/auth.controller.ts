import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, PlatformRole, Public, type AuthenticatedUser } from '../../../../common/auth';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  CreateSessionResult,
  CreateSessionUseCase,
} from '../../application/use-cases/create-session.use-case';
import { CreateSessionDto } from '../dto/create-session.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly createSessionUseCase: CreateSessionUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post('session')
  createSession(@Body() dto: CreateSessionDto): Promise<CreateSessionResult> {
    return this.createSessionUseCase.execute({
      firebaseIdToken: dto.firebaseIdToken,
    });
  }

  @ApiBearerAuth()
  @Get('me')
  async getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    const memberships = await this.prisma.organizationMembership.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        deletedAt: null,
        organization: { deletedAt: null },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
    const organizations = memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      role: membership.role,
    }));

    return {
      user,
      organizations,
      activeOrganization: organizations[0] ?? null,
      permissions: this.permissionsFor(user, organizations.map((organization) => organization.role)),
    };
  }

  @ApiBearerAuth()
  @Post('logout')
  logout(): { success: true } {
    return { success: true };
  }

  private permissionsFor(user: AuthenticatedUser, organizationRoles: string[]): string[] {
    if (user.roles.includes(PlatformRole.SuperAdmin)) {
      return ['platform.admin', 'organization.manage', 'project.manage', 'knowledge.manage', 'agent.use', 'billing.view'];
    }

    const permissions = new Set<string>(['project.read', 'report.read']);
    for (const role of organizationRoles) {
      if (role === 'ADMIN' || role === 'CONSULTANT') {
        permissions.add('project.manage');
        permissions.add('knowledge.manage');
        permissions.add('agent.use');
      }
      if (role === 'CLIENT') {
        permissions.add('agent.use');
        permissions.add('knowledge.upload');
      }
    }

    return [...permissions];
  }
}
