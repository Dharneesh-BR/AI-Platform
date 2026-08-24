import { Module } from '@nestjs/common';
import { ConversationsService } from './application/conversations.service';
import { ConversationsController } from './presentation/controllers/conversations.controller';

@Module({
  controllers: [ConversationsController],
  providers: [ConversationsService],
})
export class ConversationsModule {}