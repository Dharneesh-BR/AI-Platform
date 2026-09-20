import { Module } from '@nestjs/common';
import { AgentsModule } from '../agents/agents.module';
import { ConversationsService } from './application/conversations.service';
import { ConversationsController } from './presentation/controllers/conversations.controller';

@Module({
  imports: [AgentsModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
})
export class ConversationsModule {}
