export interface DocumentProcessingJobPayload {
  documentId: string;
  organizationId: string;
  projectId: string;
  actorUserId?: string | null;
}
