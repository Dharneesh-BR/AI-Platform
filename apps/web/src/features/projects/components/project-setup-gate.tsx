'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card, Pill, ProgressBar } from '../../../components/platform/app-shell';
import { useProject } from '../../../lib/api/query-hooks';
import { useAuth } from '../../../lib/auth/session';
import { getLifecycleProgress, getLifecycleTone } from './project-lifecycle';

interface ProjectSetupGateProps {
  projectId: string;
  featureName: string;
  requiredState?: 'DISCOVERY_COMPLETED' | 'KNOWLEDGE_READY' | 'AI_READY';
  children: ReactNode;
}

const readinessOrder: Record<string, number> = {
  CREATED: 0,
  ONBOARDING: 1,
  DISCOVERY_PENDING: 2,
  DISCOVERY_RUNNING: 3,
  FAILED: 3,
  DISCOVERY_COMPLETED: 4,
  KNOWLEDGE_READY: 5,
  AI_READY: 6,
};

function isReady(currentState: string, requiredState: string): boolean {
  return (readinessOrder[currentState] ?? -1) >= (readinessOrder[requiredState] ?? 999);
}

export function ProjectSetupGate({
  projectId,
  featureName,
  requiredState = 'AI_READY',
  children,
}: ProjectSetupGateProps) {
  const { session } = useAuth();
  const projectQuery = useProject(projectId, { accessToken: session.accessToken });
  const project = projectQuery.data;

  if (projectQuery.isLoading) {
    return <Card><h2>Checking project readiness</h2><p>Loading the latest setup state from the API.</p></Card>;
  }

  if (projectQuery.isError || !project) {
    return (
      <Card>
        <Pill tone="amber">Project unavailable</Pill>
        <h2 className="section-gap">Unable to check setup status</h2>
        <p>Open this project from the Projects page after the API is available.</p>
        <Link className="button button-primary section-gap" href="/projects">Open projects</Link>
      </Card>
    );
  }

  if (isReady(project.lifecycleState, requiredState)) {
    return <>{children}</>;
  }

  const progress = getLifecycleProgress(project.lifecycleState);
  const requirementCopy = requiredState === 'DISCOVERY_COMPLETED'
    ? `${featureName} needs the discovery profile to be generated first so project context exists. Continue the setup flow, then this workspace will unlock automatically.`
    : `${featureName} needs an approved company profile so the output is grounded in trusted project context. Continue the setup flow, then this workspace will unlock automatically.`;

  return (
    <Card>
      <div className="pill-row">
        <Pill tone={getLifecycleTone(project.lifecycleState)}>{project.lifecycleState}</Pill>
        <Pill tone="slate">{featureName} locked</Pill>
      </div>
      <h2 className="section-gap">Finish project setup first</h2>
      <p>{requirementCopy}</p>
      <div className="section-gap">
        <ProgressBar value={progress} />
      </div>
      <div className="topbar-actions section-gap">
        <Link className="button button-primary" href={project.nextRoute}>Continue setup</Link>
        <Link className="button button-muted" href={`/projects/${project.id}`}>Project workspace</Link>
      </div>
    </Card>
  );
}
