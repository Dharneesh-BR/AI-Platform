import { DiscoveryProgress } from '../../../../../features/discovery/components/discovery-progress';

interface DiscoveryProgressPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function DiscoveryProgressPage({ params }: DiscoveryProgressPageProps) {
  const { projectId } = await params;

  return <DiscoveryProgress projectId={projectId} />;
}