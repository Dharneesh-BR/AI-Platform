import type { DiscoveryJobEntity } from '../../domain/entities/discovery-job.entity';

export const DISCOVERY_QUEUE = Symbol('DISCOVERY_QUEUE');

export interface DiscoveryQueueContext {
  companyName?: string;
  websiteUrl?: string | null;
  industry?: string | null;
  businessGoals?: string[];
  primaryChallenges?: string[];
  competitors?: string[];
}

export interface DiscoveryQueue {
  enqueue(job: DiscoveryJobEntity, context?: DiscoveryQueueContext): Promise<void>;
}
