import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../../common/auth';
import { AddOrganizationMembershipUseCase } from '../../application/use-cases/add-organization-membership.use-case';
import { CreateOrganizationUseCase } from '../../application/use-cases/create-organization.use-case';
import { DeleteOrganizationUseCase } from '../../application/use-cases/delete-organization.use-case';
import { GetOrganizationUseCase } from '../../application/use-cases/get-organization.use-case';
import { ListOrganizationsUseCase } from '../../application/use-cases/list-organizations.use-case';
import { UpdateOrganizationMembershipUseCase } from '../../application/use-cases/update-organization-membership.use-case';
import { UpdateOrganizationUseCase } from '../../application/use-cases/update-organization.use-case';
import { AddOrganizationMembershipDto } from '../dto/add-organization-membership.dto';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationMembershipDto } from '../dto/update-organization-membership.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';

@ApiBearerAuth()
@ApiTags('Organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly listOrganizationsUseCase: ListOrganizationsUseCase,
    private readonly getOrganizationUseCase: GetOrganizationUseCase,
    private readonly updateOrganizationUseCase: UpdateOrganizationUseCase,
    private readonly deleteOrganizationUseCase: DeleteOrganizationUseCase,
    private readonly addOrganizationMembershipUseCase: AddOrganizationMembershipUseCase,
    private readonly updateOrganizationMembershipUseCase: UpdateOrganizationMembershipUseCase,
  ) {}

  @Post()
  create(@Body() dto: CreateOrganizationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.createOrganizationUseCase.execute({ ...dto, actor: user });
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.listOrganizationsUseCase.execute(user);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.getOrganizationUseCase.execute(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updateOrganizationUseCase.execute({ id, ...dto, actor: user });
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.deleteOrganizationUseCase.execute(id, user);
  }

  @Post(':id/memberships')
  addMembership(
    @Param('id') id: string,
    @Body() dto: AddOrganizationMembershipDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.addOrganizationMembershipUseCase.execute({
      organizationId: id,
      actor: user,
      ...dto,
    });
  }

  @Patch(':id/memberships/:membershipId')
  updateMembership(
    @Param('id') id: string,
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateOrganizationMembershipDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updateOrganizationMembershipUseCase.execute({
      organizationId: id,
      membershipId,
      actor: user,
      ...dto,
    });
  }
}