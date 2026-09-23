import { ResearchWorkspace } from '../../../../../features/research/components/research-workspace';
import { ProjectSetupGate } from '../../../../../features/projects/components/project-setup-gate';

interface ResearchPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ResearchPage({ params }: ResearchPageProps) {
  const { projectId } = await params;

  return (
    <ProjectSetupGate projectId={projectId} featureName="Research" requiredState="AI_READY">
      <ResearchWorkspace projectId={projectId} />
    </ProjectSetupGate>
  );
}
