import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../../common/auth';
import { ReportsService } from '../../application/reports.service';
import { CreateReportDto } from '../dto/create-report.dto';

@ApiBearerAuth()
@ApiTags('Reports')
@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('projects/:projectId/reports')
  list(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.listProjectReports(projectId, user);
  }

  @Post('projects/:projectId/reports')
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.createReport({
      projectId,
      actor: user,
      title: dto.title,
      sections: dto.sections,
    });
  }

  @Get('reports/:reportId')
  get(
    @Param('reportId') reportId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.getReport(reportId, user);
  }
}
