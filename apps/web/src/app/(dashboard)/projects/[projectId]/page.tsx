import { ProjectWorkspace } from '../../../../features/projects/components/project-workspace';

interface ProjectWorkspacePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectWorkspacePage({ params }: ProjectWorkspacePageProps) {
  const { projectId } = await params;

  return <ProjectWorkspace projectId={projectId} />;
}
