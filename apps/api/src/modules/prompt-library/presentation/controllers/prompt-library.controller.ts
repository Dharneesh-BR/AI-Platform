import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PromptLibraryService } from '../../application/prompt-library.service';

@ApiBearerAuth()
@ApiTags('Prompt Library')
@Controller('prompt-library')
export class PromptLibraryController {
  constructor(private readonly promptLibraryService: PromptLibraryService) {}

  @Get()
  listPrompts() {
    return this.promptLibraryService.listPrompts();
  }
}
