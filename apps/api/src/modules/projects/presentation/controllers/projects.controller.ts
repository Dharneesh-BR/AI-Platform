import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentTenant, CurrentUser, RequireTenant, type AuthenticatedUser, type RequestTenantContext } from '../../../../common/auth';
import { CreateProjectUseCase } from '../../application/use-cases/create-project.use-case';
import { DeleteProjectUseCase } from '../../application/use-cases/delete-project.use-case';
import { GetProjectUseCase } from '../../application/use-cases/get-project.use-case';
import { ListProjectsUseCase } from '../../application/use-cases/list-projects.use-case';
import { UpdateProjectUseCase } from '../../application/use-cases/update-project.use-case';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';

@ApiBearerAuth()
@ApiTags('Projects')
@RequireTenant()
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly createProjectUseCase: CreateProjectUseCase,
    private readonly listProjectsUseCase: ListProjectsUseCase,
    private readonly getProjectUseCase: GetProjectUseCase,
    private readonly updateProjectUseCase: UpdateProjectUseCase,
    private readonly deleteProjectUseCase: DeleteProjectUseCase,
  ) {}

  @Post()
  create(
    @Body() dto: CreateProjectDto,
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.createProjectUseCase.execute({ organizationId: tenant.organizationId, actor: user, ...dto });
  }

  @Get()
  list(@CurrentTenant() tenant: RequestTenantContext, @CurrentUser() user: AuthenticatedUser) {
    return this.listProjectsUseCase.execute(tenant.organizationId, user);
  }

  @Get(':projectId')
  get(
    @Param('projectId') projectId: string,
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.getProjectUseCase.execute(tenant.organizationId, projectId, user);
  }

  @Patch(':projectId')
  update(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updateProjectUseCase.execute({ organizationId: tenant.organizationId, projectId, actor: user, ...dto });
  }

  @Delete(':projectId')
  delete(
    @Param('projectId') projectId: string,
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deleteProjectUseCase.execute(tenant.organizationId, projectId, user);
  }
}