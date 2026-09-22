import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, PlatformRole, Roles, type AuthenticatedUser } from '../../../../common/auth';
import { UsersService } from '../../application/users.service';

@ApiBearerAuth()
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(PlatformRole.SuperAdmin, PlatformRole.Admin)
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.list(user.roles, user.id);
  }
}
