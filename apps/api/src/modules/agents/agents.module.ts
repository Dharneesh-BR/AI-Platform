import { Module } from '@nestjs/common';
import { AgentsService } from './application/agents.service';
import { AgentsController } from './presentation/controllers/agents.controller';

@Module({
  controllers: [AgentsController],
  providers: [AgentsService],
})
export class AgentsModule {}