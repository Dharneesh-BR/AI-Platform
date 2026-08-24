import { ResearchWorkspace } from '../../../../../features/research/components/research-workspace';

interface ResearchPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ResearchPage({ params }: ResearchPageProps) {
  const { projectId } = await params;

  return <ResearchWorkspace projectId={projectId} />;
}
