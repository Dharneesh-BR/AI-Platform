import type {
  CreateProjectRequest,
  ProjectSummary,
  UpdateProjectRequest,
} from '@platform/contracts';
import type { ApiClient } from './http-client';

export function listProjects(apiClient: ApiClient): Promise<ProjectSummary[]> {
  return apiClient.get<ProjectSummary[]>('/projects');
}

export function createProject(
  apiClient: ApiClient,
  payload: CreateProjectRequest,
): Promise<ProjectSummary> {
  return apiClient.post<ProjectSummary, CreateProjectRequest>('/projects', payload);
}

export function getProject(apiClient: ApiClient, projectId: string): Promise<ProjectSummary> {
  return apiClient.get<ProjectSummary>(`/projects/${projectId}`);
}

export function updateProject(
  apiClient: ApiClient,
  projectId: string,
  payload: UpdateProjectRequest,
): Promise<ProjectSummary> {
  return apiClient.patch<ProjectSummary, UpdateProjectRequest>(`/projects/${projectId}`, payload);
}

export function deleteProject(apiClient: ApiClient, projectId: string): Promise<void> {
  return apiClient.delete<void>(`/projects/${projectId}`);
}
