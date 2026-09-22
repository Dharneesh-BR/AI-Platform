export interface DiscoveryJobPayload {
  discoveryJobId: string;
  projectId: string;
  actorUserId?: string | null;
  companyName?: string;
  websiteUrl?: string | null;
  industry?: string | null;
  businessGoals?: string[];
  primaryChallenges?: string[];
  competitors?: string[];
}
