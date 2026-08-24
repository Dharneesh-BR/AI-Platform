import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentTenant, CurrentUser, RequireTenant, type AuthenticatedUser, type RequestTenantContext } from '../../../../common/auth';
import { ResearchService } from '../../application/research.service';
import { CreateResearchPlanDto } from '../dto/create-research-plan.dto';

@ApiBearerAuth()
@ApiTags('Research')
@RequireTenant()
@Controller('projects/:projectId/research-plans')
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Get()
  list(@Param('projectId') projectId: string, @CurrentTenant() tenant: RequestTenantContext) {
    return this.researchService.listPlans(tenant.organizationId, projectId);
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateResearchPlanDto,
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.researchService.createPlan({
      organizationId: tenant.organizationId,
      projectId,
      actorUserId: user.id,
      title: dto.title,
      question: dto.question,
      objectives: dto.objectives,
    });
  }

  @Get(':researchPlanId')
  get(
    @Param('projectId') projectId: string,
    @Param('researchPlanId') researchPlanId: string,
    @CurrentTenant() tenant: RequestTenantContext,
  ) {
    return this.researchService.getPlan(tenant.organizationId, projectId, researchPlanId);
  }
}