import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ResearchService } from './application/research.service';
import { ResearchController } from './presentation/controllers/research.controller';

@Module({
  imports: [AiModule],
  controllers: [ResearchController],
  providers: [ResearchService],
})
export class ResearchModule {}
