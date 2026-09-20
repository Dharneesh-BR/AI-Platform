import { AgentWorkspace } from '../../../../features/agents/components/agent-workspace';

interface AgentPageProps {
  params: Promise<{ agentSlug: string }>;
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { agentSlug } = await params;
  return <AgentWorkspace agentSlug={agentSlug} />;
}
