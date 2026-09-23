import type {
  CompanyProfileDto,
  DiscoveryStatusDto,
  ProjectProfileDto,
} from '@platform/contracts';
import type { ApiClient } from './http-client';

export interface UpsertProjectProfilePayload {
  companyName: string;
  websiteUrl?: string | null;
  industry?: string | null;
  companySize?: string | null;
  businessModel?: string | null;
  targetMarket?: string | null;
  businessGoals?: string[];
  primaryChallenges?: string[];
  competitors?: string[];
  onboardingStep?: string | null;
}

export function getProjectProfile(
  apiClient: ApiClient,
  projectId: string,
): Promise<ProjectProfileDto | null> {
  return apiClient.get<ProjectProfileDto>(`/projects/${projectId}/profile`).catch((error: unknown) => {
    if (error instanceof Error && /404|not found/i.test(error.message)) {
      return null;
    }

    throw error;
  });
}

export function upsertProjectProfile(
  apiClient: ApiClient,
  projectId: string,
  payload: UpsertProjectProfilePayload,
): Promise<ProjectProfileDto> {
  return apiClient.put<ProjectProfileDto, UpsertProjectProfilePayload>(
    `/projects/${projectId}/profile`,
    payload,
  );
}

export function startOnboarding(apiClient: ApiClient, projectId: string) {
  return apiClient.post<{ state: string }>(`/projects/${projectId}/onboarding/start`);
}

export function completeOnboarding(apiClient: ApiClient, projectId: string) {
  return apiClient.post<{ state: string; discoveryJobId: string }>(
    `/projects/${projectId}/onboarding/complete`,
  );
}

export function getDiscoveryStatus(
  apiClient: ApiClient,
  projectId: string,
): Promise<DiscoveryStatusDto> {
  return apiClient.get<DiscoveryStatusDto>(`/projects/${projectId}/discovery/status`);
}

export function retryDiscovery(apiClient: ApiClient, projectId: string) {
  return apiClient.post<{ discoveryJobId: string }>(`/projects/${projectId}/discovery/retry`);
}

export function getCompanyProfile(
  apiClient: ApiClient,
  projectId: string,
): Promise<CompanyProfileDto> {
  return apiClient.get<CompanyProfileDto>(`/projects/${projectId}/company-profile`);
}

export type UpdateCompanyProfilePayload = Partial<
  Pick<
    CompanyProfileDto,
    | 'mission'
    | 'vision'
    | 'industry'
    | 'targetCustomers'
    | 'products'
    | 'services'
    | 'painPoints'
    | 'uniqueSellingProposition'
  >
>;

export function updateCompanyProfile(
  apiClient: ApiClient,
  projectId: string,
  profileId: string,
  payload: UpdateCompanyProfilePayload,
): Promise<CompanyProfileDto> {
  return apiClient.patch<CompanyProfileDto, UpdateCompanyProfilePayload>(
    `/projects/${projectId}/company-profile/${profileId}`,
    payload,
  );
}

export function approveCompanyProfile(
  apiClient: ApiClient,
  projectId: string,
  profileId: string,
): Promise<CompanyProfileDto> {
  return apiClient.post<CompanyProfileDto>(
    `/projects/${projectId}/company-profile/${profileId}/approve`,
  );
}
