import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles, PlatformRole } from '../../../../common/auth';
import { ModelManagementService } from '../../application/model-management.service';

@ApiBearerAuth()
@ApiTags('Model Management')
@Controller('model-management')
export class ModelManagementController {
  constructor(private readonly modelManagementService: ModelManagementService) {}

  @Get('providers')
  @Roles(PlatformRole.SuperAdmin, PlatformRole.Admin, PlatformRole.Consultant)
  listProviders() {
    return this.modelManagementService.listProviders();
  }
}