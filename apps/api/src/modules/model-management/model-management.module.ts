import { Module } from '@nestjs/common';
import { ModelManagementService } from './application/model-management.service';
import { ModelManagementController } from './presentation/controllers/model-management.controller';

@Module({
  controllers: [ModelManagementController],
  providers: [ModelManagementService],
})
export class ModelManagementModule {}