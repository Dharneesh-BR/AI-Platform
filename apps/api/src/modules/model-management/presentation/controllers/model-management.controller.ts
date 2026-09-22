import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ModelManagementService } from '../../application/model-management.service';

@ApiBearerAuth()
@ApiTags('Model Management')
@Controller('model-management')
export class ModelManagementController {
  constructor(private readonly modelManagementService: ModelManagementService) {}

  @Get('providers')
  listProviders() {
    return this.modelManagementService.listProviders();
  }
}
