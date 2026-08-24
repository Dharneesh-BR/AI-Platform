import { Module } from '@nestjs/common';
import { AiService } from './application/ai.service';
import { AiController } from './presentation/controllers/ai.controller';

@Module({
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}