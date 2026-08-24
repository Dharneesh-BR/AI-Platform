import { ChatWorkspace } from '../../../../../features/conversations/components/chat-workspace';

interface ChatPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { projectId } = await params;

  return <ChatWorkspace projectId={projectId} />;
}
