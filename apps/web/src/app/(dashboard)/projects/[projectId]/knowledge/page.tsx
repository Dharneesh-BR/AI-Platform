import { KnowledgeWorkspace } from '../../../../../features/knowledge/components/knowledge-workspace';

interface KnowledgePageProps {
  params: Promise<{ projectId: string }>;
}

export default async function KnowledgePage({ params }: KnowledgePageProps) {
  const { projectId } = await params;

  return <KnowledgeWorkspace projectId={projectId} />;
}
