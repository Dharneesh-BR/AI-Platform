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
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  metadata?: Record<string, unknown>;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
  mode?: 'sync' | 'async';
  runId?: string;
  status?: string;
}

export interface AgentRunStatus {
  runId: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  progressLabel: string;
  progressPercent: number;
  currentStep: {
    node: string;
    specialist: string | null;
    status: string;
  } | null;
  startedAt: string | null;
  completedAt: string | null;
  answer: string | null;
  sources: unknown[];
  verification: unknown;
  errorMessage: string | null;
  steps: Array<{
    id: string;
    node: string;
    specialist: string | null;
    status: string;
    model: string | null;
    startedAt: string | null;
    completedAt: string | null;
    error: string | null;
    metadata: Record<string, unknown>;
  }>;
}

export interface Report {
  id: string;
  title: string;
  status: string;
  metadata?: Record<string, unknown>;
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
}

export interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  createdAt: string;
}

export interface KnowledgeSource {
  id: string;
  projectId: string;
  type: string;
  sourceId: string | null;
  title: string;
  content: unknown;
  metadata: Record<string, unknown>;
}

export interface KnowledgeDocument {
  id: string;
  projectId: string | null;
  title: string;
  originalFilename: string | null;
  status: 'UPLOADED' | 'QUEUED' | 'PROCESSING' | 'READY' | 'FAILED' | 'ARCHIVED';
  mimeType: string | null;
  sizeBytes: number | null;
  processingError: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    chunks: number;
  };
}

export interface KnowledgeSearchResult {
  chunkId: string;
  documentId: string;
  documentName: string;
  content: string;
  pageNumber: number | null;
  similarity: number;
  metadata: Record<string, unknown>;
}

export interface AdminHealth {
  status: 'healthy' | 'degraded' | 'unavailable';
  checkedAt: string;
  services: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'unavailable';
    detail: string;
  }>;
  counts: {
    users: number;
    projects: number;
    auditEvents: number;
  };
}

export interface BusinessAgentProfile {
  id?: string;
  name: string;
  slug: string;
  department: string;
  description: string | null;
  capabilities: string[];
  allowedSpecialists: string[];
  allowedTools: string[];
  enabled: boolean;
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
  payload: { title?: string; agentSlug?: string },
): Promise<Conversation> {
  return apiClient.post<Conversation, typeof payload>(`/projects/${projectId}/conversations`, payload);
}

export function addConversationMessage(
  apiClient: ApiClient,
  conversationId: string,
  payload: { content: string; agentSlug?: string },
): Promise<Conversation> {
  return apiClient.post<Conversation, typeof payload>(`/conversations/${conversationId}/messages`, payload);
}

export function getAgentRunStatus(apiClient: ApiClient, agentRunId: string): Promise<AgentRunStatus> {
  return apiClient.get<AgentRunStatus>(`/agent-runs/${agentRunId}/status`);
}

export function listBusinessAgents(apiClient: ApiClient): Promise<BusinessAgentProfile[]> {
  return apiClient.get<BusinessAgentProfile[]>('/agents');
}

export function listReports(apiClient: ApiClient, projectId: string): Promise<Report[]> {
  return apiClient.get<Report[]>(`/projects/${projectId}/reports`);
}

export function getReport(apiClient: ApiClient, reportId: string): Promise<Report> {
  return apiClient.get<Report>(`/reports/${reportId}`);
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

export function listKnowledgeSources(
  apiClient: ApiClient,
  projectId: string,
): Promise<KnowledgeSource[]> {
  return apiClient.get<KnowledgeSource[]>(`/projects/${projectId}/knowledge`);
}

export function createKnowledgeSource(
  apiClient: ApiClient,
  projectId: string,
  payload: { title: string; content: string; type?: string; metadata?: Record<string, unknown> },
): Promise<KnowledgeSource> {
  return apiClient.post<KnowledgeSource, typeof payload>(`/projects/${projectId}/knowledge`, payload);
}

export function listKnowledgeDocuments(
  apiClient: ApiClient,
  projectId: string,
): Promise<KnowledgeDocument[]> {
  return apiClient.get<KnowledgeDocument[]>(`/projects/${projectId}/knowledge/documents`);
}

export function uploadKnowledgeDocument(
  apiClient: ApiClient,
  projectId: string,
  file: File,
): Promise<KnowledgeDocument> {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient.post<KnowledgeDocument, FormData>(`/projects/${projectId}/knowledge/documents`, formData);
}

export function retryKnowledgeDocument(
  apiClient: ApiClient,
  projectId: string,
  documentId: string,
): Promise<KnowledgeDocument> {
  return apiClient.post<KnowledgeDocument>(`/projects/${projectId}/knowledge/documents/${documentId}/retry`);
}

export function deleteKnowledgeDocument(
  apiClient: ApiClient,
  projectId: string,
  documentId: string,
): Promise<{ archived: boolean }> {
  return apiClient.delete<{ archived: boolean }>(`/projects/${projectId}/knowledge/documents/${documentId}`);
}

export function searchKnowledge(
  apiClient: ApiClient,
  projectId: string,
  payload: { query: string; limit?: number; documentId?: string },
): Promise<KnowledgeSearchResult[]> {
  return apiClient.post<KnowledgeSearchResult[], typeof payload>(`/projects/${projectId}/knowledge/search`, payload);
}

export function getAdminHealth(apiClient: ApiClient): Promise<AdminHealth> {
  return apiClient.get<AdminHealth>('/admin/health');
}
