import { Injectable } from '@nestjs/common';
import { ResearchSourceType } from '@prisma/client';
import type { AuthenticatedUser } from '../../../../common/auth';
import { KnowledgeDocumentService } from '../services/knowledge-document.service';

export interface CreateProjectKnowledgeSourceInput {
  organizationId: string;
  projectId: string;
  actor: AuthenticatedUser;
  title: string;
  content: string;
  type?: ResearchSourceType;
  sourceId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class CreateProjectKnowledgeSourceUseCase {
  constructor(private readonly knowledgeDocumentService: KnowledgeDocumentService) {}

  async execute(input: CreateProjectKnowledgeSourceInput) {
    return this.knowledgeDocumentService.createManualSource(input);
  }
}
