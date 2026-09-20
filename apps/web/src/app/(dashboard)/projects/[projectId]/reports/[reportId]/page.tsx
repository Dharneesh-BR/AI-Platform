import { ReportDetailWorkspace } from '../../../../../../features/reports/components/report-detail-workspace';

interface ReportPageProps {
  params: Promise<{ projectId: string; reportId: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { projectId, reportId } = await params;
  return <ReportDetailWorkspace projectId={projectId} reportId={reportId} />;
}
