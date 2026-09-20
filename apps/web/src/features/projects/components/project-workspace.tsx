'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, MetricCard, Pill, ProgressBar } from '../../../components/platform/app-shell';
import { useAuth } from '../../../lib/auth/session';
import { useDeleteProject, useProject } from '../../../lib/api/query-hooks';
import { getLifecycleProgress, getLifecycleTone } from './project-lifecycle';

interface ProjectWorkspaceProps {
  projectId: string;
}

function getModuleHref(projectId: string, module: string): string {
  return `/projects/${projectId}/${module}`;
}

export function ProjectWorkspace({ projectId }: ProjectWorkspaceProps) {
  const router = useRouter();
  const { session } = useAuth();
  const normalizedProjectId = projectId;
  const context = {
    accessToken: session.accessToken,
    organizationId: session.organizationId,
  };
  const projectQuery = useProject(normalizedProjectId, {
    accessToken: context.accessToken,
    organizationId: context.organizationId,
  });
  const deleteProject = useDeleteProject(normalizedProjectId, context);
  const [deleteMessage, setDeleteMessage] = useState('');
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
        title: 'AI Workforce',
        detail: 'Ask Magnafic AI and specialized agents',
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

  const activeProject = project;

  async function handleDeleteProject() {
    const confirmed = window.confirm(`Delete "${activeProject.name}"? This removes it from your active project list.`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteProject.mutateAsync();
      router.replace('/projects');
    } catch (error) {
      setDeleteMessage(error instanceof Error ? error.message : 'Unable to delete project.');
    }
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
          <Link className="button button-primary" href={project.nextRoute}>Continue setup</Link>
        </div>
      </header>

      <section className="grid-3">
        <MetricCard label="Lifecycle" value={project.lifecycleState} detail="Live project context." />
        <MetricCard label="Status" value={project.status} detail="Project delivery status." />
        <MetricCard label="Readiness" value={`${lifecycleProgress}%`} detail="Progress toward AI-ready workflows." />
      </section>

      <section className="grid-2 section-gap">
        <Card>
          <h2>Recommended next step</h2>
          <p>
            Use this order for the MVP workflow: finish onboarding, review discovery, add knowledge,
            chat with the AI workforce, then generate a report.
          </p>
          <div className="topbar-actions section-gap">
            <Link className="button button-primary" href={project.nextRoute}>Continue</Link>
            <Link className="button button-muted" href={getModuleHref(project.id, 'knowledge')}>Add knowledge</Link>
          </div>
        </Card>
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

      <Card className="section-gap">
        <div className="pill-row">
          <Pill tone="amber">Project actions</Pill>
        </div>
        <h2 className="section-gap">Delete project</h2>
        <p>Remove this project from the active workspace list. Existing database records are archived, not hard-deleted.</p>
        <button
          className="button button-muted section-gap"
          type="button"
          onClick={() => void handleDeleteProject()}
          disabled={deleteProject.isPending}
        >
          {deleteProject.isPending ? 'Deleting...' : 'Delete project'}
        </button>
        {deleteMessage ? <p className="section-gap">{deleteMessage}</p> : null}
      </Card>
    </div>
  );
}
