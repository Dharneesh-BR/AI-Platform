import { Body, Controller, Delete, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../../common/auth';
import { GetProjectKnowledgeUseCase } from '../../application/use-cases/get-project-knowledge.use-case';
import { CreateProjectKnowledgeSourceUseCase } from '../../application/use-cases/create-project-knowledge-source.use-case';
import { CreateProjectKnowledgeSourceDto } from '../dto/create-project-knowledge-source.dto';
import { KnowledgeDocumentService } from '../../application/services/knowledge-document.service';
import { VectorSearchService } from '../../application/services/vector-search.service';
import { SearchKnowledgeDto } from '../dto/search-knowledge.dto';

interface UploadedKnowledgeFile {
  originalname: string;
  mimetype?: string;
  size: number;
  buffer: Buffer;
}

@ApiBearerAuth()
@ApiTags('Knowledge Base')
@Controller('projects/:projectId/knowledge')
export class ProjectKnowledgeController {
  constructor(
    private readonly getProjectKnowledgeUseCase: GetProjectKnowledgeUseCase,
    private readonly createProjectKnowledgeSourceUseCase: CreateProjectKnowledgeSourceUseCase,
    private readonly knowledgeDocumentService: KnowledgeDocumentService,
    private readonly vectorSearchService: VectorSearchService,
  ) {}

  @Get()
  getProjectKnowledge(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.getProjectKnowledgeUseCase.execute(projectId, user);
  }

  @Post()
  createProjectKnowledgeSource(
    @Param('projectId') projectId: string,
    @Body() dto: CreateProjectKnowledgeSourceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.createProjectKnowledgeSourceUseCase.execute({
      projectId,
      actor: user,
      title: dto.title,
      content: dto.content,
      type: dto.type,
      sourceId: dto.sourceId,
      metadata: dto.metadata,
    });
  }

  @Get('documents')
  listDocuments(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.knowledgeDocumentService.list(projectId, user);
  }

  @Post('documents')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @Param('projectId') projectId: string,
    @UploadedFile() file: UploadedKnowledgeFile,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.knowledgeDocumentService.upload({
      projectId,
      actor: user,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      buffer: file.buffer,
    });
  }

  @Get('documents/:documentId')
  getDocument(
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.knowledgeDocumentService.get(projectId, documentId, user);
  }

  @Post('documents/:documentId/retry')
  retryDocument(
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.knowledgeDocumentService.retry(projectId, documentId, user);
  }

  @Delete('documents/:documentId')
  archiveDocument(
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.knowledgeDocumentService.archive(projectId, documentId, user);
  }

  @Post('search')
  searchKnowledge(
    @Param('projectId') projectId: string,
    @Body() dto: SearchKnowledgeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vectorSearchService.search({
      projectId,
      userId: user.id,
      query: dto.query,
      limit: dto.limit,
      documentId: dto.documentId,
      allowedKnowledgeScopes: ['GENERAL', 'SALES', 'MARKETING', 'FINANCE', 'LEGAL', 'HR', 'PRODUCTION', 'EXECUTIVE'],
    });
  }
}
