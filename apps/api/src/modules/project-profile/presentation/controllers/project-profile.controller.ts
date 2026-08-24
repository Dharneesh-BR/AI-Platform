import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentTenant,
  CurrentUser,
  RequireTenant,
  type AuthenticatedUser,
  type RequestTenantContext,
} from '../../../../common/auth';
import { GetProjectProfileUseCase } from '../../application/use-cases/get-project-profile.use-case';
import { UpsertProjectProfileUseCase } from '../../application/use-cases/upsert-project-profile.use-case';
import { UpsertProjectProfileDto } from '../dto/upsert-project-profile.dto';

@ApiBearerAuth()
@ApiTags('Project Profile')
@RequireTenant()
@Controller('projects/:projectId/profile')
export class ProjectProfileController {
  constructor(
    private readonly getProjectProfileUseCase: GetProjectProfileUseCase,
    private readonly upsertProjectProfileUseCase: UpsertProjectProfileUseCase,
  ) {}

  @Get()
  getProfile(
    @Param('projectId') projectId: string,
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.getProjectProfileUseCase.execute(tenant.organizationId, projectId, user);
  }

  @Put()
  upsertProfile(
    @Param('projectId') projectId: string,
    @Body() dto: UpsertProjectProfileDto,
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.upsertProjectProfileUseCase.execute({
      organizationId: tenant.organizationId,
      projectId,
      actor: user,
      ...dto,
    });
  }
}

