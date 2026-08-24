import { Module } from '@nestjs/common';
import { ResearchService } from './application/research.service';
import { ResearchController } from './presentation/controllers/research.controller';

@Module({
  controllers: [ResearchController],
  providers: [ResearchService],
})
export class ResearchModule {}