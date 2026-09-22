import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/auth';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { DiscoveryJobEntity } from '../../domain/entities/discovery-job.entity';
import type { DiscoveryJobRepository } from '../../application/ports/discovery-job.repository';

@Injectable()
export class PrismaDiscoveryJobRepository implements DiscoveryJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPending(
    projectId: string,
    actor: AuthenticatedUser,
    idempotencyKey?: string,
  ): Promise<DiscoveryJobEntity> {
    await this.ensureOwnedProject(projectId, actor);

    const job = await this.prisma.discoveryJob.create({
      data: {
        projectId,
        idempotencyKey,
        status: 'PENDING',
        currentStep: 'queued',
        steps: this.defaultSteps(),
        createdBy: actor.id,
        updatedBy: actor.id,
      },
    });

    return this.mapJob(job);
  }

  async findLatest(
    projectId: string,
    actor: AuthenticatedUser,
  ): Promise<DiscoveryJobEntity | null> {
    const job = await this.prisma.discoveryJob.findFirst({
      where: {
        projectId,
        deletedAt: null,
        project: {
          createdBy: actor.id,
          deletedAt: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return job ? this.mapJob(job) : null;
  }

  private async ensureOwnedProject(projectId: string, actor: AuthenticatedUser): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        createdBy: actor.id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }
  }

  private defaultSteps(): Array<{ key: string; label: string; status: string }> {
    return [
      { key: 'read_website', label: 'Reading website', status: 'PENDING' },
      { key: 'find_products', label: 'Finding products', status: 'PENDING' },
      { key: 'understand_services', label: 'Understanding services', status: 'PENDING' },
      { key: 'detect_competitors', label: 'Detecting competitors', status: 'PENDING' },
      { key: 'build_profile', label: 'Building company profile', status: 'PENDING' },
      { key: 'save_context', label: 'Saving project context', status: 'PENDING' },
      { key: 'prepare_workspace', label: 'Preparing AI workspace', status: 'PENDING' },
    ];
  }

  private mapJob(job: {
    id: string;
    projectId: string;
    status: string;
    progress: number;
    currentStep: string | null;
    steps: unknown;
    errorMessage: string | null;
    createdBy: string | null;
  }): DiscoveryJobEntity {
    return {
      id: job.id,
      projectId: job.projectId,
      status: job.status,
      progress: job.progress,
      currentStep: job.currentStep,
      steps: Array.isArray(job.steps) ? job.steps : [],
      errorMessage: job.errorMessage,
      createdBy: job.createdBy,
    };
  }
}
