import { Injectable, NotFoundException } from '@nestjs/common';
import {
  assertProjectLifecycleTransition,
  ProjectLifecycleState,
} from '@platform/domain';
import type { AuthenticatedUser } from '../../../../common/auth';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { ProjectLifecycleRepository } from '../../application/ports/project-lifecycle.repository';

@Injectable()
export class PrismaProjectLifecycleRepository implements ProjectLifecycleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getLifecycleState(projectId: string, actor: AuthenticatedUser): Promise<ProjectLifecycleState> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        createdBy: actor.id,
        deletedAt: null,
      },
      select: {
        lifecycleState: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    return project.lifecycleState as ProjectLifecycleState;
  }

  async transition(
    projectId: string,
    nextState: ProjectLifecycleState,
    actor: AuthenticatedUser,
  ): Promise<ProjectLifecycleState> {
    const currentState = await this.getLifecycleState(projectId, actor);
    if (currentState === nextState) {
      return currentState;
    }

    assertProjectLifecycleTransition(currentState, nextState);

    const project = await this.prisma.project.update({
      where: {
        id: projectId,
        createdBy: actor.id,
        deletedAt: null,
      },
      data: {
        lifecycleState: nextState,
        updatedBy: actor.id,
      },
      select: {
        lifecycleState: true,
      },
    });

    return project.lifecycleState as ProjectLifecycleState;
  }
}
