import type { ApiClient } from './http-client';

export interface ResearchPlan {
  id: string;
  title: string;
  question: string;
  objectives: string[];
  status: string;
  createdAt: string;
}

export interface ConversationMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  title: string;
  status: string;
  sections: Array<{
    id: string;
    title: string;
    kind: string;
    ordinal: number;
    content: unknown;
  }>;
  createdAt: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  status: string;
  description: string | null;
  versions: Array<{
    id: string;
    version: number;
    content: string;
  }>;
}

export interface ModelProvider {
  id: string;
  name: string;
  enabled: boolean;
  baseUrl: string | null;
  models: Array<{
    id: string;
    modelKey: string;
    displayName: string;
    enabled: boolean;
    capabilities: unknown;
  }>;
}

export interface BillingAccount {
  id: string;
  planKey: string;
  status: string;
  metadata: Record<string, unknown>;
  usageRecords: Array<{
    id: string;
    metricKey: string;
    quantity: string;
    occurredAt: string;
  }>;
}

export interface UserSummary {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
}

export interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  createdAt: string;
}

export function listResearchPlans(apiClient: ApiClient, projectId: string): Promise<ResearchPlan[]> {
  return apiClient.get<ResearchPlan[]>(`/projects/${projectId}/research-plans`);
}

export function createResearchPlan(
  apiClient: ApiClient,
  projectId: string,
  payload: { title: string; question: string; objectives?: string[] },
): Promise<ResearchPlan> {
  return apiClient.post<ResearchPlan, typeof payload>(`/projects/${projectId}/research-plans`, payload);
}

export function listConversations(apiClient: ApiClient, projectId: string): Promise<Conversation[]> {
  return apiClient.get<Conversation[]>(`/projects/${projectId}/conversations`);
}

export function createConversation(
  apiClient: ApiClient,
  projectId: string,
  payload: { title?: string },
): Promise<Conversation> {
  return apiClient.post<Conversation, typeof payload>(`/projects/${projectId}/conversations`, payload);
}

export function addConversationMessage(
  apiClient: ApiClient,
  conversationId: string,
  payload: { content: string },
): Promise<Conversation> {
  return apiClient.post<Conversation, typeof payload>(`/conversations/${conversationId}/messages`, payload);
}

export function listReports(apiClient: ApiClient, projectId: string): Promise<Report[]> {
  return apiClient.get<Report[]>(`/projects/${projectId}/reports`);
}

export function createReport(
  apiClient: ApiClient,
  projectId: string,
  payload: { title: string },
): Promise<Report> {
  return apiClient.post<Report, typeof payload>(`/projects/${projectId}/reports`, payload);
}

export function listPromptTemplates(apiClient: ApiClient): Promise<PromptTemplate[]> {
  return apiClient.get<PromptTemplate[]>('/prompt-library');
}

export function listModelProviders(apiClient: ApiClient): Promise<ModelProvider[]> {
  return apiClient.get<ModelProvider[]>('/model-management/providers');
}

export function getBillingAccount(apiClient: ApiClient): Promise<BillingAccount> {
  return apiClient.get<BillingAccount>('/billing/account');
}

export function listUsers(apiClient: ApiClient): Promise<UserSummary[]> {
  return apiClient.get<UserSummary[]>('/users');
}

export function listAuditLogs(apiClient: ApiClient): Promise<AuditLog[]> {
  return apiClient.get<AuditLog[]>('/audit-logs');
}
