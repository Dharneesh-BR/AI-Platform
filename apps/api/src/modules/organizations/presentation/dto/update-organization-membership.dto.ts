import { IsEnum, IsOptional } from 'class-validator';
import { PlatformRole } from '../../../../common/auth';
import { OrganizationMembershipStatus } from '../../domain/entities/organization-membership.entity';

export class UpdateOrganizationMembershipDto {
  @IsOptional()
  @IsEnum(PlatformRole)
  role?: PlatformRole;

  @IsOptional()
  @IsEnum(OrganizationMembershipStatus)
  status?: OrganizationMembershipStatus;
}

