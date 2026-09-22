import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../../common/auth';
import { ResearchService } from '../../application/research.service';
import { CreateResearchPlanDto } from '../dto/create-research-plan.dto';

@ApiBearerAuth()
@ApiTags('Research')
@Controller('projects/:projectId/research-plans')
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Get()
  list(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.researchService.listPlans(projectId, user);
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateResearchPlanDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.researchService.createPlan({
      projectId,
      actor: user,
      title: dto.title,
      question: dto.question,
      objectives: dto.objectives,
    });
  }

  @Get(':researchPlanId')
  get(
    @Param('projectId') projectId: string,
    @Param('researchPlanId') researchPlanId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.researchService.getPlan(projectId, researchPlanId, user);
  }
}
