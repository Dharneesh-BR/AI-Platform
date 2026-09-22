export enum ProjectLifecycleStateDto {
  Created = 'CREATED',
  Onboarding = 'ONBOARDING',
  DiscoveryPending = 'DISCOVERY_PENDING',
  DiscoveryRunning = 'DISCOVERY_RUNNING',
  DiscoveryCompleted = 'DISCOVERY_COMPLETED',
  KnowledgeReady = 'KNOWLEDGE_READY',
  AiReady = 'AI_READY',
  Failed = 'FAILED',
}

export interface ProjectSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  lifecycleState: ProjectLifecycleStateDto;
  nextRoute: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string | null;
}

