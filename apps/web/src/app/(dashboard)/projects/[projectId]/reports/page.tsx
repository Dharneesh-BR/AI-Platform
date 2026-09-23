import { ReportsWorkspace } from '../../../../../features/reports/components/reports-workspace';
import { ProjectSetupGate } from '../../../../../features/projects/components/project-setup-gate';

interface ReportsPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { projectId } = await params;

  return (
    <ProjectSetupGate projectId={projectId} featureName="Reports" requiredState="AI_READY">
      <ReportsWorkspace projectId={projectId} />
    </ProjectSetupGate>
  );
}
