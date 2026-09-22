export interface ResearchSourceEntity {
  id: string;
  projectId: string;
  type: string;
  sourceId: string | null;
  title: string;
  content: unknown;
  metadata: Record<string, unknown>;
}
