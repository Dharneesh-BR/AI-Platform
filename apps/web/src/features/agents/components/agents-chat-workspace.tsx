'use client';

import Link from 'next/link';
import { ProjectLifecycleStateDto } from '@platform/contracts';
import { Card, Pill, ProgressBar } from '../../../components/platform/app-shell';
import { useProjects } from '../../../lib/api/query-hooks';
import { useAuth } from '../../../lib/auth/session';
import { ChatWorkspace } from '../../conversations/components/chat-workspace';
import { getLifecycleProgress, getLifecycleTone } from '../../projects/components/project-lifecycle';

export function AgentsChatWorkspace() {
  const { session } = useAuth();
  const projectsQuery = useProjects({ accessToken: session.accessToken });
  const projects = projectsQuery.data ?? [];
  const project = projects[0];

  if (projectsQuery.isLoading) {
    return (
      <Card>
        <span className="eyebrow">Agents</span>
        <h1>Loading Magnafic AI...</h1>
        <p>Finding your active project context before opening the chat.</p>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card>
        <span className="eyebrow">Agents</span>
        <h1>Chat with Magnafic AI</h1>
        <p>Create a project first so Magnafic AI has company context for the conversation.</p>
        <div className="topbar-actions section-gap">
          <Link className="button button-primary" href="/projects">Create project</Link>
        </div>
      </Card>
    );
  }

  if (
    project.lifecycleState !== ProjectLifecycleStateDto.AiReady &&
    project.lifecycleState !== ProjectLifecycleStateDto.KnowledgeReady
  ) {
    return (
      <Card>
        <div className="pill-row">
          <Pill tone={getLifecycleTone(project.lifecycleState)}>{project.lifecycleState}</Pill>
          <Pill tone="slate">Magnafic AI locked</Pill>
        </div>
        <h1 className="section-gap">Finish setup for {project.name}</h1>
        <p>Magnafic AI needs an approved company profile before it can answer with trusted company context.</p>
        <div className="section-gap">
          <ProgressBar value={getLifecycleProgress(project.lifecycleState)} />
        </div>
        <div className="topbar-actions section-gap">
          <Link className="button button-primary" href={project.nextRoute}>Continue setup</Link>
          <Link className="button button-muted" href={`/projects/${project.id}`}>Project workspace</Link>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <header className="topbar">
        <div>
          <span className="eyebrow">Agents</span>
          <h1>Chat with Magnafic AI.</h1>
          <p>Use the general Magnafic AI agent for strategy, priorities, research direction, and project-aware answers.</p>
        </div>
        <div className="topbar-actions">
          <Link className="button button-muted" href={`/projects/${project.id}`}>Project</Link>
          <Link className="button button-muted" href="/workforce">SI Workforce</Link>
        </div>
      </header>

      <ChatWorkspace
        embedded
        initialAgentSlug="magnafic-ai"
        projectId={project.id}
        showAgentPicker={false}
      />
    </div>
  );
}
