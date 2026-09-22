import type { AuthenticatedUser } from '../../../../common/auth';
import type { DiscoveryJobEntity } from '../../domain/entities/discovery-job.entity';

export const DISCOVERY_JOB_REPOSITORY = Symbol('DISCOVERY_JOB_REPOSITORY');

export interface DiscoveryJobRepository {
  createPending(
    projectId: string,
    actor: AuthenticatedUser,
    idempotencyKey?: string,
  ): Promise<DiscoveryJobEntity>;
  findLatest(
    projectId: string,
    actor: AuthenticatedUser,
  ): Promise<DiscoveryJobEntity | null>;
}
