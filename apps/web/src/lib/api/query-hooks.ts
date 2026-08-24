'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from './http-client';
import {
  createOrganization,
  listOrganizations,
  type CreateOrganizationPayload,
} from './organizations';
import {
  createProject,
  getProject,
  listProjects,
} from './projects';
import {
  completeOnboarding,
  approveCompanyProfile,
  getCompanyProfile,
  getDiscoveryStatus,
  getProjectProfile,
  updateCompanyProfile,
  upsertProjectProfile,
  type UpdateCompanyProfilePayload,
  type UpsertProjectProfilePayload,
} from './onboarding';
import type { CreateProjectRequest } from '@platform/contracts';
import {
  addConversationMessage,
  createConversation,
  createReport,
  createResearchPlan,
  getBillingAccount,
  listAuditLogs,
  listConversations,
  listModelProviders,
  listPromptTemplates,
  listReports,
  listResearchPlans,
  listUsers,
} from './platform';

interface QueryAuthContext {
  accessToken?: string;
  organizationId?: string;
}

function useApiClient(context?: QueryAuthContext) {
  return createApiClient(context);
}

export function useOrganizations(context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['organizations'],
    queryFn: () => listOrganizations(apiClient),
    enabled: Boolean(context?.accessToken),
  });
}

export function useCreateOrganization(context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrganizationPayload) => createOrganization(apiClient, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
  });
}

export function useProjects(context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['projects', context?.organizationId],
    queryFn: () => listProjects(apiClient),
    enabled: Boolean(context?.accessToken && context.organizationId),
  });
}

export function useCreateProject(context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectRequest) => createProject(apiClient, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects', context?.organizationId] }),
  });
}

export function useProject(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['project', projectId, context?.organizationId],
    queryFn: () => getProject(apiClient, projectId),
    enabled: Boolean(context?.accessToken && context.organizationId && projectId),
  });
}

export function useProjectProfile(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['project-profile', projectId, context?.organizationId],
    queryFn: () => getProjectProfile(apiClient, projectId),
    enabled: Boolean(context?.accessToken && context.organizationId && projectId),
  });
}

export function useUpsertProjectProfile(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertProjectProfilePayload) =>
      upsertProjectProfile(apiClient, projectId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['project-profile', projectId, context?.organizationId],
      }),
  });
}

export function useCompleteOnboarding(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => completeOnboarding(apiClient, projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['project', projectId, context?.organizationId] });
      void queryClient.invalidateQueries({ queryKey: ['discovery-status', projectId, context?.organizationId] });
    },
  });
}

export function useDiscoveryStatus(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['discovery-status', projectId, context?.organizationId],
    queryFn: () => getDiscoveryStatus(apiClient, projectId),
    enabled: Boolean(context?.accessToken && context.organizationId && projectId),
    refetchInterval: 5_000,
  });
}

export function useCompanyProfile(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['company-profile', projectId, context?.organizationId],
    queryFn: () => getCompanyProfile(apiClient, projectId),
    enabled: Boolean(context?.accessToken && context.organizationId && projectId),
  });
}

export function useUpdateCompanyProfile(
  projectId: string,
  profileId: string,
  context?: QueryAuthContext,
) {
  const apiClient = useApiClient(context);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCompanyProfilePayload) =>
      updateCompanyProfile(apiClient, projectId, profileId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['company-profile', projectId, context?.organizationId],
      }),
  });
}

export function useApproveCompanyProfile(
  projectId: string,
  profileId: string,
  context?: QueryAuthContext,
) {
  const apiClient = useApiClient(context);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => approveCompanyProfile(apiClient, projectId, profileId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['company-profile', projectId, context?.organizationId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['project', projectId, context?.organizationId],
      });
    },
  });
}

export function useResearchPlans(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['research-plans', projectId, context?.organizationId],
    queryFn: () => listResearchPlans(apiClient, projectId),
    enabled: Boolean(context?.accessToken && context.organizationId && projectId),
  });
}

export function useCreateResearchPlan(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { title: string; question: string; objectives?: string[] }) =>
      createResearchPlan(apiClient, projectId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['research-plans', projectId, context?.organizationId] }),
  });
}

export function useConversations(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['conversations', projectId, context?.organizationId],
    queryFn: () => listConversations(apiClient, projectId),
    enabled: Boolean(context?.accessToken && context.organizationId && projectId),
  });
}

export function useCreateConversation(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { title?: string }) => createConversation(apiClient, projectId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations', projectId, context?.organizationId] }),
  });
}

export function useAddConversationMessage(projectId: string, conversationId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { content: string }) => addConversationMessage(apiClient, conversationId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations', projectId, context?.organizationId] }),
  });
}

export function useReports(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['reports', projectId, context?.organizationId],
    queryFn: () => listReports(apiClient, projectId),
    enabled: Boolean(context?.accessToken && context.organizationId && projectId),
  });
}

export function useCreateReport(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { title: string }) => createReport(apiClient, projectId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports', projectId, context?.organizationId] }),
  });
}

export function usePromptTemplates(context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['prompt-library'],
    queryFn: () => listPromptTemplates(apiClient),
    enabled: Boolean(context?.accessToken),
  });
}

export function useModelProviders(context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['model-providers'],
    queryFn: () => listModelProviders(apiClient),
    enabled: Boolean(context?.accessToken),
  });
}

export function useBillingAccount(context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['billing-account', context?.organizationId],
    queryFn: () => getBillingAccount(apiClient),
    enabled: Boolean(context?.accessToken && context.organizationId),
  });
}

export function useUsers(context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['users', context?.organizationId],
    queryFn: () => listUsers(apiClient),
    enabled: Boolean(context?.accessToken && context.organizationId),
  });
}

export function useAuditLogs(context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['audit-logs', context?.organizationId],
    queryFn: () => listAuditLogs(apiClient),
    enabled: Boolean(context?.accessToken && context.organizationId),
  });
}
