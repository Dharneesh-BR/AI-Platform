export interface DocumentProcessingJobPayload {
  documentId: string;
  projectId: string;
  actorUserId?: string | null;
}
