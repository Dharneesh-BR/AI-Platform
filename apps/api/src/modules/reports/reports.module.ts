import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ReportsService } from './application/reports.service';
import { ReportsController } from './presentation/controllers/reports.controller';

@Module({
  imports: [AiModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
