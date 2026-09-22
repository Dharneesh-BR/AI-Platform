import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../../common/auth';
import { ApproveCompanyProfileUseCase } from '../../application/use-cases/approve-company-profile.use-case';
import { GetCompanyProfileUseCase } from '../../application/use-cases/get-company-profile.use-case';
import { UpdateCompanyProfileUseCase } from '../../application/use-cases/update-company-profile.use-case';
import { UpdateCompanyProfileDto } from '../dto/update-company-profile.dto';

@ApiBearerAuth()
@ApiTags('Company Profile')
@Controller('projects/:projectId/company-profile')
export class CompanyProfileController {
  constructor(
    private readonly getCompanyProfileUseCase: GetCompanyProfileUseCase,
    private readonly updateCompanyProfileUseCase: UpdateCompanyProfileUseCase,
    private readonly approveCompanyProfileUseCase: ApproveCompanyProfileUseCase,
  ) {}

  @Get()
  getCompanyProfile(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.getCompanyProfileUseCase.execute(projectId, user);
  }

  @Patch(':profileId')
  updateCompanyProfile(
    @Param('projectId') projectId: string,
    @Param('profileId') profileId: string,
    @Body() dto: UpdateCompanyProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updateCompanyProfileUseCase.execute({
      projectId,
      profileId,
      actor: user,
      ...dto,
    });
  }

  @Post(':profileId/approve')
  approveCompanyProfile(
    @Param('projectId') projectId: string,
    @Param('profileId') profileId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.approveCompanyProfileUseCase.execute(
      projectId,
      profileId,
      user,
    );
  }
}
