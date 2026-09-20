import { WorkforceChat } from './workforce-chat';

interface AgentWorkspaceProps {
  agentSlug: string;
}

export function AgentWorkspace({ agentSlug }: AgentWorkspaceProps) {
  return <WorkforceChat initialAgentSlug={agentSlug} />;
}
