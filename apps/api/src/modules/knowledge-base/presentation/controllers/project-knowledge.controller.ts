import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentTenant,
  CurrentUser,
  RequireTenant,
  type AuthenticatedUser,
  type RequestTenantContext,
} from '../../../../common/auth';
import { GetProjectKnowledgeUseCase } from '../../application/use-cases/get-project-knowledge.use-case';

@ApiBearerAuth()
@ApiTags('Knowledge Base')
@RequireTenant()
@Controller('projects/:projectId/knowledge')
export class ProjectKnowledgeController {
  constructor(private readonly getProjectKnowledgeUseCase: GetProjectKnowledgeUseCase) {}

  @Get()
  getProjectKnowledge(
    @Param('projectId') projectId: string,
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.getProjectKnowledgeUseCase.execute(tenant.organizationId, projectId, user);
  }
}
