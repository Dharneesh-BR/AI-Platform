export interface ProjectProfileDto {
  id: string;
  organizationId: string;
  projectId: string;
  companyName: string;
  websiteUrl: string | null;
  industry: string | null;
  companySize: string | null;
  businessModel: string | null;
  targetMarket: string | null;
  businessGoals: string[];
  primaryChallenges: string[];
  competitors: string[];
  onboardingStep: string | null;
  completedAt: string | null;
}

export interface DiscoveryStatusDto {
  projectId: string;
  status: string;
  progress: number;
  currentStep: string | null;
  steps: Array<{
    key: string;
    label: string;
    status: string;
  }>;
}

export interface CompanyProfileDto {
  id: string;
  projectId: string;
  version: number;
  isApproved: boolean;
  mission: string | null;
  vision: string | null;
  industry: string | null;
  targetCustomers: string[];
  products: string[];
  services: string[];
  painPoints: string[];
  uniqueSellingProposition: string | null;
  summaries?: Record<string, unknown> | null;
  sourceMetadata?: Record<string, unknown> | null;
}
