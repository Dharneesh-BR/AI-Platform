import { Injectable } from '@nestjs/common';
import { DiscoveryStatus, Prisma, ProjectLifecycleState } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type {
  DiscoveryExecutionRepository,
  DiscoveryStepUpdate,
} from '../../application/ports/discovery-execution.repository';

@Injectable()
export class PrismaDiscoveryExecutionRepository implements DiscoveryExecutionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async markRunning(discoveryJobId: string, currentStep: string): Promise<void> {
    await this.prisma.discoveryJob.update({
      where: { id: discoveryJobId },
      data: {
        status: DiscoveryStatus.RUNNING,
        currentStep,
        startedAt: new Date(),
        attempts: { increment: 1 },
      },
    });
  }

  async updateProgress(
    discoveryJobId: string,
    progress: number,
    currentStep: string,
    steps: DiscoveryStepUpdate[],
  ): Promise<void> {
    await this.prisma.discoveryJob.update({
      where: { id: discoveryJobId },
      data: {
        progress,
        currentStep,
        steps: steps as unknown as Prisma.InputJsonArray,
      },
    });
  }

  async markCompleted(discoveryJobId: string): Promise<void> {
    await this.prisma.discoveryJob.update({
      where: { id: discoveryJobId },
      data: {
        status: DiscoveryStatus.COMPLETED,
        progress: 100,
        currentStep: 'completed',
        completedAt: new Date(),
      },
    });
  }

  async markFailed(discoveryJobId: string, errorMessage: string): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const job = await transaction.discoveryJob.update({
        where: { id: discoveryJobId },
        data: {
          status: DiscoveryStatus.FAILED,
          currentStep: 'failed',
          errorMessage,
        },
        select: {
          projectId: true,
          updatedBy: true,
        },
      });

      await transaction.project.update({
        where: { id: job.projectId },
        data: {
          lifecycleState: ProjectLifecycleState.FAILED,
          updatedBy: job.updatedBy,
        },
      });
    });
  }
}
