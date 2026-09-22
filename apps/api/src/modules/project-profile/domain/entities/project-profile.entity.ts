export interface ProjectProfileEntity {
  id: string;
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
  documents: unknown[];
  brandGuidelines: unknown[];
  strategyDocuments: unknown[];
  onboardingStep: string | null;
  completedAt: Date | null;
}
