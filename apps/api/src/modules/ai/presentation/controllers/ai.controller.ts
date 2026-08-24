import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, PlatformRole, Roles, type AuthenticatedUser } from '../../../../common/auth';
import { AiService } from '../../application/ai.service';
import { CreateAiExecutionDto } from '../dto/create-ai-execution.dto';

@ApiBearerAuth()
@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('executions')
  @Roles(PlatformRole.SuperAdmin, PlatformRole.Admin, PlatformRole.Consultant)
  listExecutions() {
    return this.aiService.listExecutions();
  }

  @Post('executions')
  @Roles(PlatformRole.SuperAdmin, PlatformRole.Admin, PlatformRole.Consultant)
  createExecution(@Body() dto: CreateAiExecutionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.aiService.createExecution({
      input: dto.input,
      modelConfigId: dto.modelConfigId,
      actorUserId: user.id,
    });
  }
}