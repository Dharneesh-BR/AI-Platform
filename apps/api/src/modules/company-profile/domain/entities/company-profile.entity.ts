export interface CompanyProfileEntity {
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
