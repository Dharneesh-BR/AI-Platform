import { Body, Controller, Delete, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentTenant,
  CurrentUser,
  PlatformRole,
  RequireTenant,
  type AuthenticatedUser,
  type RequestTenantContext,
} from '../../../../common/auth';
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
@RequireTenant()
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
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.getProjectKnowledgeUseCase.execute(tenant.organizationId, projectId, user);
  }

  @Post()
  createProjectKnowledgeSource(
    @Param('projectId') projectId: string,
    @Body() dto: CreateProjectKnowledgeSourceDto,
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.createProjectKnowledgeSourceUseCase.execute({
      organizationId: tenant.organizationId,
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
    @CurrentTenant() tenant: RequestTenantContext,
  ) {
    return this.knowledgeDocumentService.list(tenant.organizationId, projectId);
  }

  @Post('documents')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @Param('projectId') projectId: string,
    @UploadedFile() file: UploadedKnowledgeFile,
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.knowledgeDocumentService.upload({
      organizationId: tenant.organizationId,
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
    @CurrentTenant() tenant: RequestTenantContext,
  ) {
    return this.knowledgeDocumentService.get(tenant.organizationId, projectId, documentId);
  }

  @Post('documents/:documentId/retry')
  retryDocument(
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.knowledgeDocumentService.retry(tenant.organizationId, projectId, documentId, user);
  }

  @Delete('documents/:documentId')
  archiveDocument(
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.knowledgeDocumentService.archive(tenant.organizationId, projectId, documentId, user);
  }

  @Post('search')
  searchKnowledge(
    @Param('projectId') projectId: string,
    @Body() dto: SearchKnowledgeDto,
    @CurrentTenant() tenant: RequestTenantContext,
  ) {
    return this.vectorSearchService.search({
      organizationId: tenant.organizationId,
      projectId,
      query: dto.query,
      limit: dto.limit,
      documentId: dto.documentId,
      allowedKnowledgeScopes: this.allowedKnowledgeScopesForRole(tenant.role),
    });
  }

  private allowedKnowledgeScopesForRole(role?: PlatformRole): string[] {
    if (role === PlatformRole.SuperAdmin || role === PlatformRole.Admin || role === PlatformRole.Consultant) {
      return ['GENERAL', 'SALES', 'MARKETING', 'FINANCE', 'LEGAL', 'HR', 'PRODUCTION', 'EXECUTIVE'];
    }

    return ['GENERAL'];
  }
}
