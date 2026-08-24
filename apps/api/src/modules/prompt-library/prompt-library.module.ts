import { Module } from '@nestjs/common';
import { PromptLibraryService } from './application/prompt-library.service';
import { PromptLibraryController } from './presentation/controllers/prompt-library.controller';

@Module({
  controllers: [PromptLibraryController],
  providers: [PromptLibraryService],
})
export class PromptLibraryModule {}