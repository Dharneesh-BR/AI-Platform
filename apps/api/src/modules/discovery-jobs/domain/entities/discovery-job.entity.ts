export interface DiscoveryJobEntity {
  id: string;
  tenantId: string;
  organizationId: string;
  projectId: string;
  status: string;
  progress: number;
  currentStep: string | null;
  steps: unknown[];
  errorMessage: string | null;
  createdBy: string | null;
}
