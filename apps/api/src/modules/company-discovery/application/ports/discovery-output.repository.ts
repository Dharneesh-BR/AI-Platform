export const DISCOVERY_OUTPUT_REPOSITORY = Symbol('DISCOVERY_OUTPUT_REPOSITORY');

export interface PersistDiscoveryOutputInput {
  organizationId: string;
  projectId: string;
  actorUserId: string | null;
  companyName: string;
  industry?: string | null;
  mission?: string | null;
  vision?: string | null;
  products: string[];
  services: string[];
  targetCustomers: string[];
  competitors: Array<{
    name: string;
    websiteUrl?: string | null;
    positioning?: string | null;
  }>;
  goals: Array<{
    title: string;
    description?: string | null;
  }>;
  technologies: Array<{
    name: string;
    category?: string | null;
    confidence?: number | null;
  }>;
  painPoints: string[];
  uniqueSellingProposition?: string | null;
  summaries: Record<string, unknown>;
  sourceMetadata: Record<string, unknown>;
}

export interface DiscoveryOutputRepository {
  persist(input: PersistDiscoveryOutputInput): Promise<{ companyProfileId: string; version: number }>;
}