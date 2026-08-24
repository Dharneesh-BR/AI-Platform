export interface ResearchSourceEntity {
  id: string;
  organizationId: string;
  projectId: string;
  type: string;
  sourceId: string | null;
  title: string;
  content: unknown;
  metadata: Record<string, unknown>;
}

