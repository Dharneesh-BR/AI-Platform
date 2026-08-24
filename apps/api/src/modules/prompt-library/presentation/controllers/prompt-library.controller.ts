import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles, PlatformRole } from '../../../../common/auth';
import { PromptLibraryService } from '../../application/prompt-library.service';

@ApiBearerAuth()
@ApiTags('Prompt Library')
@Controller('prompt-library')
export class PromptLibraryController {
  constructor(private readonly promptLibraryService: PromptLibraryService) {}

  @Get()
  @Roles(PlatformRole.SuperAdmin, PlatformRole.Admin, PlatformRole.Consultant)
  listPrompts() {
    return this.promptLibraryService.listPrompts();
  }
}