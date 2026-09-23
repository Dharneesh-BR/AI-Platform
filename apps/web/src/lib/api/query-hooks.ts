'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from './http-client';
import { hasApiAuth } from '../auth/api-access';
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
} from './projects';
import {
  completeOnboarding,
  approveCompanyProfile,
  getCompanyProfile,
  getDiscoveryStatus,
  getProjectProfile,
  retryDiscovery,
  updateCompanyProfile,
  upsertProjectProfile,
  type UpdateCompanyProfilePayload,
  type UpsertProjectProfilePayload,
} from './onboarding';
import type { CreateProjectRequest } from '@platform/contracts';
import {
  addConversationMessage,
  createConversation,
  createKnowledgeSource,
  deleteKnowledgeDocument,
  createReport,
  getAdminHealth,
  createResearchPlan,
  getAgentRunStatus,
  getBillingAccount,
  getReport,
  listAuditLogs,
  listBusinessAgents,
  listConversations,
  listKnowledgeSources,
  listKnowledgeDocuments,
  listModelProviders,
  listPromptTemplates,
  listReports,
  listResearchPlans,
  listUsers,
  retryKnowledgeDocument,
  searchKnowledge,
  uploadKnowledgeDocument,
  type Conversation,
} from './platform';

interface QueryAuthContext {
  accessToken?: string;
}

function useApiClient(context?: QueryAuthContext) {
  return createApiClient(context);
}

function hasUserContext(context?: QueryAuthContext): boolean {
  return hasApiAuth(context);
}

export function useProjects(context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => listProjects(apiClient),
    enabled: hasUserContext(context),
  });
}

export function useCreateProject(context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectRequest) => createProject(apiClient, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useProject(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(apiClient, projectId),
    enabled: Boolean(hasUserContext(context) && projectId),
  });
}

export function useDeleteProject(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteProject(apiClient, projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      void queryClient.removeQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useProjectProfile(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['project-profile', projectId],
    queryFn: () => getProjectProfile(apiClient, projectId),
    enabled: Boolean(hasUserContext(context) && projectId),
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
        queryKey: ['project-profile', projectId],
      }),
  });
}

export function useCompleteOnboarding(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => completeOnboarding(apiClient, projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['discovery-status', projectId] });
    },
  });
}

export function useDiscoveryStatus(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['discovery-status', projectId],
    queryFn: () => getDiscoveryStatus(apiClient, projectId),
    enabled: Boolean(hasUserContext(context) && projectId),
    refetchInterval: 5_000,
  });
}

export function useRetryDiscovery(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => retryDiscovery(apiClient, projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['discovery-status', projectId] });
    },
  });
}

export function useCompanyProfile(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['company-profile', projectId],
    queryFn: () => getCompanyProfile(apiClient, projectId),
    enabled: Boolean(hasUserContext(context) && projectId),
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
        queryKey: ['company-profile', projectId],
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
        queryKey: ['company-profile', projectId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['project', projectId],
      });
    },
  });
}

export function useResearchPlans(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['research-plans', projectId],
    queryFn: () => listResearchPlans(apiClient, projectId),
    enabled: Boolean(hasUserContext(context) && projectId),
  });
}

export function useCreateResearchPlan(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { title: string; question: string; objectives?: string[] }) =>
      createResearchPlan(apiClient, projectId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['research-plans', projectId] }),
  });
}

export function useConversations(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['conversations', projectId],
    queryFn: () => listConversations(apiClient, projectId),
    enabled: Boolean(hasUserContext(context) && projectId),
  });
}

export function useCreateConversation(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { title?: string; agentSlug?: string }) => createConversation(apiClient, projectId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations', projectId] }),
  });
}

function mergeConversation(existing: Conversation[] | undefined, conversation: Conversation): Conversation[] {
  const conversations = existing ?? [];
  return [
    conversation,
    ...conversations.filter((candidate) => candidate.id !== conversation.id),
  ];
}

export function useAddConversationMessage(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { conversationId: string; content: string; agentSlug?: string }) =>
      addConversationMessage(apiClient, payload.conversationId, { content: payload.content, agentSlug: payload.agentSlug }),
    onSuccess: (conversation) => {
      queryClient.setQueryData<Conversation[]>(['conversations', projectId], (existing) =>
        mergeConversation(existing, conversation),
      );
      void queryClient.invalidateQueries({ queryKey: ['conversations', projectId] });
    },
  });
}

export function useAgentRunStatus(agentRunId: string | undefined, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['agent-run-status', agentRunId],
    queryFn: () => getAgentRunStatus(apiClient, agentRunId ?? ''),
    enabled: Boolean(hasUserContext(context) && agentRunId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'QUEUED' || status === 'RUNNING' ? 2_500 : false;
    },
  });
}

export function useBusinessAgents(context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['business-agents'],
    queryFn: () => listBusinessAgents(apiClient),
    enabled: hasUserContext(context),
  });
}

export function useReports(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['reports', projectId],
    queryFn: () => listReports(apiClient, projectId),
    enabled: Boolean(hasUserContext(context) && projectId),
  });
}

export function useReport(reportId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['report', reportId],
    queryFn: () => getReport(apiClient, reportId),
    enabled: Boolean(hasUserContext(context) && reportId),
  });
}

export function useCreateReport(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { title: string }) => createReport(apiClient, projectId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports', projectId] }),
  });
}

export function usePromptTemplates(context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['prompt-library'],
    queryFn: () => listPromptTemplates(apiClient),
    enabled: hasApiAuth(context),
  });
}

export function useModelProviders(context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['model-providers'],
    queryFn: () => listModelProviders(apiClient),
    enabled: hasApiAuth(context),
  });
}

export function useBillingAccount(context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['billing-account'],
    queryFn: () => getBillingAccount(apiClient),
    enabled: hasUserContext(context),
  });
}

export function useUsers(context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(apiClient),
    enabled: hasUserContext(context),
  });
}

export function useAuditLogs(context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => listAuditLogs(apiClient),
    enabled: hasUserContext(context),
  });
}

export function useKnowledgeSources(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['knowledge-sources', projectId],
    queryFn: () => listKnowledgeSources(apiClient, projectId),
    enabled: Boolean(hasUserContext(context) && projectId),
  });
}

export function useKnowledgeDocuments(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['knowledge-documents', projectId],
    queryFn: () => listKnowledgeDocuments(apiClient, projectId),
    enabled: Boolean(hasUserContext(context) && projectId),
    refetchInterval: 5_000,
  });
}

export function useCreateKnowledgeSource(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { title: string; content: string; type?: string; metadata?: Record<string, unknown> }) =>
      createKnowledgeSource(apiClient, projectId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['knowledge-sources', projectId],
      }),
  });
}

export function useUploadKnowledgeDocument(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadKnowledgeDocument(apiClient, projectId, file),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['knowledge-documents', projectId],
      }),
  });
}

export function useRetryKnowledgeDocument(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => retryKnowledgeDocument(apiClient, projectId, documentId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['knowledge-documents', projectId],
      }),
  });
}

export function useDeleteKnowledgeDocument(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => deleteKnowledgeDocument(apiClient, projectId, documentId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['knowledge-documents', projectId],
      }),
  });
}

export function useSearchKnowledge(projectId: string, context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useMutation({
    mutationFn: (payload: { query: string; limit?: number; documentId?: string }) =>
      searchKnowledge(apiClient, projectId, payload),
  });
}

export function useAdminHealth(context?: QueryAuthContext) {
  const apiClient = useApiClient(context);
  return useQuery({
    queryKey: ['admin-health'],
    queryFn: () => getAdminHealth(apiClient),
    enabled: hasApiAuth(context),
    refetchInterval: 30_000,
  });
}
