import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../../common/auth';
import { GetProjectProfileUseCase } from '../../application/use-cases/get-project-profile.use-case';
import { UpsertProjectProfileUseCase } from '../../application/use-cases/upsert-project-profile.use-case';
import { UpsertProjectProfileDto } from '../dto/upsert-project-profile.dto';

@ApiBearerAuth()
@ApiTags('Project Profile')
@Controller('projects/:projectId/profile')
export class ProjectProfileController {
  constructor(
    private readonly getProjectProfileUseCase: GetProjectProfileUseCase,
    private readonly upsertProjectProfileUseCase: UpsertProjectProfileUseCase,
  ) {}

  @Get()
  getProfile(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.getProjectProfileUseCase.execute(projectId, user);
  }

  @Put()
  upsertProfile(
    @Param('projectId') projectId: string,
    @Body() dto: UpsertProjectProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.upsertProjectProfileUseCase.execute({
      projectId,
      actor: user,
      ...dto,
    });
  }
}
