'use client';

import Link from 'next/link';
import type { ProjectSummary } from '@platform/contracts';
import { useDeleteProject, useProjects } from '../../../lib/api/query-hooks';
import { useAuth } from '../../../lib/auth/session';
import { Card, MetricCard, Pill, ProgressBar } from '../../../components/platform/app-shell';
import { CreateProjectCard } from './create-project-card';
import { getLifecycleProgress, getLifecycleTone, getProjectRoute } from './project-lifecycle';

function countByLifecycle(projects: ProjectSummary[], state: string): number {
  return projects.filter((project) => project.lifecycleState === state).length;
}

interface ProjectListCardProps {
  project: ProjectSummary;
  accessToken?: string;
}

function ProjectListCard({ project, accessToken }: ProjectListCardProps) {
  const deleteProject = useDeleteProject(project.id, { accessToken });

  async function handleDelete() {
    const confirmed = window.confirm(`Delete "${project.name}"? This removes it from your active project list.`);

    if (!confirmed) {
      return;
    }

    await deleteProject.mutateAsync();
  }

  return (
    <Card>
      <div className="topbar" style={{ marginBottom: 0 }}>
        <div>
          <h2>{project.name}</h2>
          <p>{project.description}</p>
        </div>
        <div className="pill-row">
          <Pill tone="green">Live API</Pill>
          <Pill tone={getLifecycleTone(project.lifecycleState)}>{project.lifecycleState}</Pill>
        </div>
      </div>
      <div className="section-gap">
        <ProgressBar value={getLifecycleProgress(project.lifecycleState)} />
      </div>
      <div className="topbar-actions section-gap">
        <Link className="button button-primary" href={getProjectRoute(project.id, project.nextRoute)}>
          Open project
        </Link>
        <button
          className="button button-muted"
          type="button"
          onClick={() => void handleDelete()}
          disabled={deleteProject.isPending}
        >
          {deleteProject.isPending ? 'Deleting...' : 'Delete project'}
        </button>
      </div>
    </Card>
  );
}

export function LiveProjectsSection() {
  const { session } = useAuth();
  const projectsQuery = useProjects({
    accessToken: session.accessToken,
  });
  const projects = projectsQuery.data ?? [];
  const inDiscovery =
    countByLifecycle(projects, 'DISCOVERY_PENDING') + countByLifecycle(projects, 'DISCOVERY_RUNNING');
  const aiReady = countByLifecycle(projects, 'AI_READY') + countByLifecycle(projects, 'KNOWLEDGE_READY');

  return (
    <>
      <section className="grid-3">
        <MetricCard label="Total projects" value={String(projects.length)} detail="Loaded from live API." />
        <MetricCard label="In discovery" value={String(inDiscovery)} detail="Projects building company context." />
        <MetricCard label="AI ready" value={String(aiReady)} detail="Approved context available for AI workflows." />
      </section>

      <section className="section-gap">
        <CreateProjectCard />
      </section>

      {projectsQuery.isLoading ? (
        <section className="card section-gap">
          <h2>Loading live projects</h2>
          <p>Fetching projects from the API using the signed-in session.</p>
        </section>
      ) : null}

      {projectsQuery.isError ? (
        <Card className="section-gap">
          <div className="pill-row">
            <Pill tone="amber">API unavailable</Pill>
            <Pill tone="slate">{session.mode}</Pill>
          </div>
          <h2 className="section-gap">Projects could not be loaded</h2>
          <p>
            Start the API, run migrations, seed the database, and log in with an API session.
          </p>
        </Card>
      ) : null}

      {!projectsQuery.isLoading && !projectsQuery.isError && projects.length === 0 ? (
        <Card className="section-gap">
          <h2>No projects yet</h2>
          <p>Create a project after the API session is available.</p>
        </Card>
      ) : null}

      <section className="stack section-gap">
        {projects.map((project) => (
          <ProjectListCard
            key={project.id}
            project={project}
            accessToken={session.accessToken}
          />
        ))}
      </section>
    </>
  );
}
