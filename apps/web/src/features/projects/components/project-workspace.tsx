'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Card, MetricCard, Pill, ProgressBar } from '../../../components/platform/app-shell';
import { useAuth } from '../../../lib/auth/session';
import { useProject } from '../../../lib/api/query-hooks';
import { getLifecycleProgress, getLifecycleTone } from './project-lifecycle';

interface ProjectWorkspaceProps {
  projectId: string;
}

function getModuleHref(projectId: string, module: string): string {
  return `/projects/${projectId}/${module}`;
}

export function ProjectWorkspace({ projectId }: ProjectWorkspaceProps) {
  const { session } = useAuth();
  const normalizedProjectId = projectId;
  const projectQuery = useProject(normalizedProjectId, {
    accessToken: session.accessToken,
    organizationId: session.organizationId,
  });
  const project = projectQuery.data;
  const lifecycleProgress = project ? getLifecycleProgress(project.lifecycleState) : 0;
  const enabledModules = useMemo(
    () => [
      {
        href: getModuleHref(project?.id ?? normalizedProjectId, 'onboarding'),
        title: 'Onboarding',
        detail: 'Edit company and project context',
        tone: lifecycleProgress >= 36 ? 'green' : 'amber',
      },
      {
        href: getModuleHref(project?.id ?? normalizedProjectId, 'company-profile'),
        title: 'Company Profile',
        detail: 'Review and approve discovered context',
        tone: lifecycleProgress >= 82 ? 'green' : 'amber',
      },
      {
        href: getModuleHref(project?.id ?? normalizedProjectId, 'knowledge'),
        title: 'Knowledge',
        detail: 'Search company and project sources',
        tone: lifecycleProgress >= 92 ? 'green' : 'slate',
      },
      {
        href: getModuleHref(project?.id ?? normalizedProjectId, 'research'),
        title: 'Research',
        detail: 'Plan strategy analysis',
        tone: lifecycleProgress >= 92 ? 'green' : 'slate',
      },
      {
        href: getModuleHref(project?.id ?? normalizedProjectId, 'chat'),
        title: 'AI Chat',
        detail: 'Ask company-aware questions',
        tone: lifecycleProgress >= 100 ? 'green' : 'slate',
      },
      {
        href: getModuleHref(project?.id ?? normalizedProjectId, 'reports'),
        title: 'Reports',
        detail: 'Create consulting deliverables',
        tone: lifecycleProgress >= 100 ? 'green' : 'slate',
      },
    ],
    [project?.id, normalizedProjectId, lifecycleProgress],
  );

  if (projectQuery.isLoading) {
    return <Card><h2>Loading project</h2><p>Fetching project workspace from the live API.</p></Card>;
  }

  if (projectQuery.isError || !project) {
    return (
      <Card>
        <div className="pill-row"><Pill tone="amber">API required</Pill><Pill tone="slate">{session.mode}</Pill></div>
        <h2 className="section-gap">Project could not be loaded</h2>
        <p>Start the backend, seed the database, and open a real project from the Projects page.</p>
      </Card>
    );
  }

  return (
    <div>
      <header className="topbar">
        <div>
          <span className="eyebrow">Project Workspace</span>
          <h1>{project.name}</h1>
          <p>{project.description ?? 'Project workspace for governed AI consulting delivery.'}</p>
        </div>
        <div className="topbar-actions">
          <Link className="button button-muted" href={getModuleHref(project.id, 'company-profile')}>Review profile</Link>
          <Link className="button button-primary" href={getModuleHref(project.id, 'research')}>Start research</Link>
        </div>
      </header>

      <section className="grid-3">
        <MetricCard label="Lifecycle" value={project.lifecycleState} detail="Live project context." />
        <MetricCard label="Status" value={project.status} detail="Project delivery status." />
        <MetricCard label="Readiness" value={`${lifecycleProgress}%`} detail="Progress toward AI-ready workflows." />
      </section>

      <section className="grid-2 section-gap">
        <Card>
          <div className="pill-row">
            <Pill tone="green">Live API</Pill>
            <Pill tone={getLifecycleTone(project.lifecycleState)}>{project.lifecycleState}</Pill>
          </div>
          <h2 className="section-gap">AI readiness</h2>
          <ProgressBar value={lifecycleProgress} />
          <div className="pill-row section-gap">
            <Pill tone={lifecycleProgress >= 82 ? 'green' : 'slate'}>Profile approved</Pill>
            <Pill tone={lifecycleProgress >= 92 ? 'green' : 'slate'}>Knowledge ready</Pill>
            <Pill tone={lifecycleProgress >= 100 ? 'green' : 'slate'}>AI context ready</Pill>
          </div>
        </Card>
        <Card>
          <h2>Workspace modules</h2>
          <div className="timeline">
            {enabledModules.map((module) => (
              <Link className="timeline-item" href={module.href} key={module.href}>
                <strong>{module.title}</strong>
                <span>
                  {module.detail} <Pill tone={module.tone as 'green' | 'amber' | 'slate'}>{module.tone === 'green' ? 'Ready' : 'Next'}</Pill>
                </span>
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
