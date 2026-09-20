'use client';

import Link from 'next/link';
import { Card, MetricCard, Pill, ProgressBar } from '../../../components/platform/app-shell';
import { useAdminHealth, useBusinessAgents, useProjects } from '../../../lib/api/query-hooks';
import { useAuth } from '../../../lib/auth/session';
import { getLifecycleProgress, getLifecycleTone, getProjectRoute } from '../../projects/components/project-lifecycle';

export function DashboardWorkspace() {
  const { session } = useAuth();
  const context = { accessToken: session.accessToken, organizationId: session.organizationId };
  const projectsQuery = useProjects(context);
  const agentsQuery = useBusinessAgents(context);
  const healthQuery = useAdminHealth(context);
  const projects = projectsQuery.data ?? [];
  const agents = agentsQuery.data ?? [];
  const aiReady = projects.filter((project) => ['AI_READY', 'KNOWLEDGE_READY'].includes(project.lifecycleState)).length;
  const inProgress = projects.filter((project) => ['ONBOARDING', 'DISCOVERY_PENDING', 'DISCOVERY_RUNNING', 'DISCOVERY_COMPLETED'].includes(project.lifecycleState)).length;

  return (
    <div>
      <header className="topbar">
        <div>
          <span className="eyebrow">Command Center</span>
          <h1>What needs attention across your AI initiatives?</h1>
          <p>Track projects, readiness, agent availability and platform health from one live workspace.</p>
        </div>
        <div className="topbar-actions">
          <Link className="button button-muted" href="/workforce">Open AI Workforce</Link>
          <Link className="button button-primary" href="/projects">Create project</Link>
        </div>
      </header>

      <section className="grid-3">
        <MetricCard label="Active projects" value={String(projects.length)} detail="Loaded from the live projects API." />
        <MetricCard label="In progress" value={String(inProgress)} detail="Onboarding, discovery or assessment underway." />
        <MetricCard label="AI ready" value={String(aiReady)} detail="Projects with approved context for agents." />
      </section>

      <section className="grid-2 section-gap">
        <Card>
          <div className="pill-row">
            <Pill tone={healthQuery.data?.status === 'healthy' ? 'green' : 'amber'}>
              {healthQuery.data?.status ?? 'Checking'}
            </Pill>
            <Pill tone="slate">{session.mode}</Pill>
          </div>
          <h2 className="section-gap">Platform readiness</h2>
          <div className="timeline">
            {(healthQuery.data?.services ?? []).slice(0, 6).map((service) => (
              <div className="timeline-item" key={service.name}>
                <div>
                  <strong>{service.name}</strong>
                  <span>{service.detail}</span>
                </div>
                <Pill tone={service.status === 'healthy' ? 'green' : 'amber'}>{service.status}</Pill>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2>Recent projects</h2>
          {projectsQuery.isLoading ? <p>Loading projects...</p> : null}
          {!projectsQuery.isLoading && projects.length === 0 ? (
            <div className="empty-state">
              <h3>No projects yet</h3>
              <p>Create your first project to begin the AI readiness journey.</p>
            </div>
          ) : null}
          <div className="timeline">
            {projects.slice(0, 5).map((project) => (
              <Link className="timeline-item" href={getProjectRoute(project.id, project.nextRoute)} key={project.id}>
                <div>
                  <strong>{project.name}</strong>
                  <span>{project.description ?? 'AI readiness project'}</span>
                  <ProgressBar value={getLifecycleProgress(project.lifecycleState)} />
                </div>
                <Pill tone={getLifecycleTone(project.lifecycleState)}>{project.lifecycleState}</Pill>
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid-2 section-gap">
        <Card>
          <h2>AI Workforce</h2>
          <p>{agents.length} live agent profiles are available to this organization.</p>
          <div className="pill-row section-gap">
            {agents.slice(0, 6).map((agent) => <Pill key={agent.slug}>{agent.name}</Pill>)}
          </div>
        </Card>
        <Card>
          <h2>Recommended next actions</h2>
          <div className="timeline">
            <Link className="timeline-item" href="/projects"><strong>Create or open a project</strong><span>Continue onboarding and discovery.</span></Link>
            <Link className="timeline-item" href="/workforce"><strong>Open an AI agent</strong><span>Ask a company-aware question.</span></Link>
            <Link className="timeline-item" href="/model-management"><strong>Review AI configuration</strong><span>Confirm models are connected through the gateway.</span></Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
