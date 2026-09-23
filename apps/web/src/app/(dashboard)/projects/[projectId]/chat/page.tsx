import { ChatWorkspace } from '../../../../../features/conversations/components/chat-workspace';
import { ProjectSetupGate } from '../../../../../features/projects/components/project-setup-gate';

interface ChatPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { projectId } = await params;

  return (
    <ProjectSetupGate projectId={projectId} featureName="AI Chat" requiredState="AI_READY">
      <ChatWorkspace projectId={projectId} />
    </ProjectSetupGate>
  );
}
