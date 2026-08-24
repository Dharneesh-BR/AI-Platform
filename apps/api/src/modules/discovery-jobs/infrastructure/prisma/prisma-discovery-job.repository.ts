import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/auth';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { DiscoveryJobEntity } from '../../domain/entities/discovery-job.entity';
import type { DiscoveryJobRepository } from '../../application/ports/discovery-job.repository';

@Injectable()
export class PrismaDiscoveryJobRepository implements DiscoveryJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPending(
    organizationId: string,
    projectId: string,
    actor: AuthenticatedUser,
    idempotencyKey?: string,
  ): Promise<DiscoveryJobEntity> {
    const job = await this.prisma.discoveryJob.create({
      data: {
        tenantId: organizationId,
        organizationId,
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
    organizationId: string,
    projectId: string,
    _actor: AuthenticatedUser,
  ): Promise<DiscoveryJobEntity | null> {
    const job = await this.prisma.discoveryJob.findFirst({
      where: {
        organizationId,
        projectId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return job ? this.mapJob(job) : null;
  }

  private defaultSteps(): Array<{ key: string; label: string; status: string }> {
    return [
      { key: 'read_website', label: 'Reading website', status: 'PENDING' },
      { key: 'find_products', label: 'Finding products', status: 'PENDING' },
      { key: 'understand_services', label: 'Understanding services', status: 'PENDING' },
      { key: 'detect_competitors', label: 'Detecting competitors', status: 'PENDING' },
      { key: 'build_profile', label: 'Building company profile', status: 'PENDING' },
      { key: 'create_knowledge', label: 'Creating knowledge base', status: 'PENDING' },
      { key: 'prepare_workspace', label: 'Preparing AI workspace', status: 'PENDING' },
    ];
  }

  private mapJob(job: {
    id: string;
    tenantId: string;
    organizationId: string;
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
      tenantId: job.tenantId,
      organizationId: job.organizationId,
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
