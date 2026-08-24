import { Module } from '@nestjs/common';
import { NotificationsService } from './application/notifications.service';
import { NotificationsController } from './presentation/controllers/notifications.controller';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}