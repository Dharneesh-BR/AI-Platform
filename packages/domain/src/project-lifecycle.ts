export enum ProjectLifecycleState {
  Created = 'CREATED',
  Onboarding = 'ONBOARDING',
  DiscoveryPending = 'DISCOVERY_PENDING',
  DiscoveryRunning = 'DISCOVERY_RUNNING',
  DiscoveryCompleted = 'DISCOVERY_COMPLETED',
  KnowledgeReady = 'KNOWLEDGE_READY',
  AiReady = 'AI_READY',
  Failed = 'FAILED',
}

const transitions: Record<ProjectLifecycleState, ProjectLifecycleState[]> = {
  [ProjectLifecycleState.Created]: [
    ProjectLifecycleState.Onboarding,
    ProjectLifecycleState.AiReady,
    ProjectLifecycleState.Failed,
  ],
  [ProjectLifecycleState.Onboarding]: [
    ProjectLifecycleState.DiscoveryPending,
    ProjectLifecycleState.Failed,
  ],
  [ProjectLifecycleState.DiscoveryPending]: [
    ProjectLifecycleState.DiscoveryRunning,
    ProjectLifecycleState.Failed,
  ],
  [ProjectLifecycleState.DiscoveryRunning]: [
    ProjectLifecycleState.DiscoveryCompleted,
    ProjectLifecycleState.Failed,
  ],
  [ProjectLifecycleState.DiscoveryCompleted]: [
    ProjectLifecycleState.KnowledgeReady,
    ProjectLifecycleState.AiReady,
    ProjectLifecycleState.DiscoveryPending,
    ProjectLifecycleState.Failed,
  ],
  [ProjectLifecycleState.KnowledgeReady]: [
    ProjectLifecycleState.AiReady,
    ProjectLifecycleState.DiscoveryPending,
    ProjectLifecycleState.Failed,
  ],
  [ProjectLifecycleState.AiReady]: [
    ProjectLifecycleState.DiscoveryPending,
    ProjectLifecycleState.Failed,
  ],
  [ProjectLifecycleState.Failed]: [
    ProjectLifecycleState.DiscoveryPending,
    ProjectLifecycleState.Onboarding,
  ],
};

export function canTransitionProjectLifecycle(
  currentState: ProjectLifecycleState,
  nextState: ProjectLifecycleState,
): boolean {
  return transitions[currentState].includes(nextState);
}

export function assertProjectLifecycleTransition(
  currentState: ProjectLifecycleState,
  nextState: ProjectLifecycleState,
): void {
  if (!canTransitionProjectLifecycle(currentState, nextState)) {
    throw new Error(`Invalid project lifecycle transition: ${currentState} -> ${nextState}`);
  }
}

export function getProjectRouteForLifecycle(state: ProjectLifecycleState, projectId: string): string {
  const routeMap: Record<ProjectLifecycleState, string> = {
    [ProjectLifecycleState.Created]: `/projects/${projectId}/onboarding`,
    [ProjectLifecycleState.Onboarding]: `/projects/${projectId}/onboarding`,
    [ProjectLifecycleState.DiscoveryPending]: `/projects/${projectId}/discovery`,
    [ProjectLifecycleState.DiscoveryRunning]: `/projects/${projectId}/discovery`,
    [ProjectLifecycleState.DiscoveryCompleted]: `/projects/${projectId}/company-profile`,
    [ProjectLifecycleState.KnowledgeReady]: `/projects/${projectId}/company-profile`,
    [ProjectLifecycleState.AiReady]: `/projects/${projectId}`,
    [ProjectLifecycleState.Failed]: `/projects/${projectId}/discovery`,
  };

  return routeMap[state];
}
