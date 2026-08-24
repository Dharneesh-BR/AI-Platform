import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentTenant, CurrentUser, RequireTenant, type AuthenticatedUser, type RequestTenantContext } from '../../../../common/auth';
import { ReportsService } from '../../application/reports.service';
import { CreateReportDto } from '../dto/create-report.dto';

@ApiBearerAuth()
@ApiTags('Reports')
@RequireTenant()
@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('projects/:projectId/reports')
  list(@Param('projectId') projectId: string, @CurrentTenant() tenant: RequestTenantContext) {
    return this.reportsService.listProjectReports(tenant.organizationId, projectId);
  }

  @Post('projects/:projectId/reports')
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateReportDto,
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.createReport({
      organizationId: tenant.organizationId,
      projectId,
      actorUserId: user.id,
      title: dto.title,
      sections: dto.sections,
    });
  }

  @Get('reports/:reportId')
  get(@Param('reportId') reportId: string, @CurrentTenant() tenant: RequestTenantContext) {
    return this.reportsService.getReport(tenant.organizationId, reportId);
  }
}