import type { ProjectLifecycleStateDto } from '@platform/contracts';

export function getLifecycleProgress(state: ProjectLifecycleStateDto | string): number {
  const progressMap: Record<string, number> = {
    CREATED: 12,
    ONBOARDING: 36,
    DISCOVERY_PENDING: 48,
    DISCOVERY_RUNNING: 72,
    DISCOVERY_COMPLETED: 82,
    KNOWLEDGE_READY: 92,
    AI_READY: 100,
    FAILED: 20,
  };

  return progressMap[state] ?? 0;
}

export function getLifecycleTone(
  state: ProjectLifecycleStateDto | string,
): 'blue' | 'green' | 'amber' | 'slate' {
  if (state === 'AI_READY' || state === 'KNOWLEDGE_READY') {
    return 'green';
  }

  if (state === 'ONBOARDING' || state === 'DISCOVERY_PENDING' || state === 'DISCOVERY_RUNNING') {
    return 'amber';
  }

  return state === 'FAILED' ? 'slate' : 'blue';
}

export function getProjectRoute(projectId: string, nextRoute?: string): string {
  if (!nextRoute) {
    return `/projects/${projectId}`;
  }

  return nextRoute;
}
