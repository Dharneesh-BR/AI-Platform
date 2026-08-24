import type {
  OrganizationMembershipSummary,
  OrganizationSummary,
} from '@platform/contracts';
import type { ApiClient } from './http-client';

export interface CreateOrganizationPayload {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateOrganizationPayload {
  name?: string;
  description?: string | null;
}

export interface AddOrganizationMembershipPayload {
  userId: string;
  role: string;
}

export interface UpdateOrganizationMembershipPayload {
  role?: string;
  status?: string;
}

export function listOrganizations(apiClient: ApiClient): Promise<OrganizationSummary[]> {
  return apiClient.get<OrganizationSummary[]>('/organizations');
}

export function createOrganization(
  apiClient: ApiClient,
  payload: CreateOrganizationPayload,
): Promise<OrganizationSummary> {
  return apiClient.post<OrganizationSummary, CreateOrganizationPayload>('/organizations', payload);
}

export function getOrganization(
  apiClient: ApiClient,
  organizationId: string,
): Promise<OrganizationSummary> {
  return apiClient.get<OrganizationSummary>(`/organizations/${organizationId}`);
}

export function updateOrganization(
  apiClient: ApiClient,
  organizationId: string,
  payload: UpdateOrganizationPayload,
): Promise<OrganizationSummary> {
  return apiClient.patch<OrganizationSummary, UpdateOrganizationPayload>(
    `/organizations/${organizationId}`,
    payload,
  );
}

export function addOrganizationMembership(
  apiClient: ApiClient,
  organizationId: string,
  payload: AddOrganizationMembershipPayload,
): Promise<OrganizationMembershipSummary> {
  return apiClient.post<OrganizationMembershipSummary, AddOrganizationMembershipPayload>(
    `/organizations/${organizationId}/memberships`,
    payload,
  );
}

