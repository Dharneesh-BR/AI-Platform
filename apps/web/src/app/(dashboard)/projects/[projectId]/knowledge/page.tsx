import { KnowledgeWorkspace } from '../../../../../features/knowledge/components/knowledge-workspace';
import { ProjectSetupGate } from '../../../../../features/projects/components/project-setup-gate';

interface KnowledgePageProps {
  params: Promise<{ projectId: string }>;
}

export default async function KnowledgePage({ params }: KnowledgePageProps) {
  const { projectId } = await params;

  return (
    <ProjectSetupGate projectId={projectId} featureName="Knowledge Base" requiredState="DISCOVERY_COMPLETED">
      <KnowledgeWorkspace projectId={projectId} />
    </ProjectSetupGate>
  );
}
