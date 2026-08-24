import { ReportsWorkspace } from '../../../../../features/reports/components/reports-workspace';

interface ReportsPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { projectId } = await params;

  return <ReportsWorkspace projectId={projectId} />;
}
