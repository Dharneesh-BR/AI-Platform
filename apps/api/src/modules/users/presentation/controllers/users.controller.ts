import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentTenant, CurrentUser, PlatformRole, RequireTenant, Roles, type AuthenticatedUser, type RequestTenantContext } from '../../../../common/auth';
import { UsersService } from '../../application/users.service';

@ApiBearerAuth()
@ApiTags('Users')
@RequireTenant()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(PlatformRole.SuperAdmin, PlatformRole.Admin)
  list(@CurrentTenant() tenant: RequestTenantContext, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.list(tenant.organizationId, user.roles);
  }
}