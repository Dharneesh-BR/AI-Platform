import { IsEnum, IsUUID } from 'class-validator';
import { PlatformRole } from '../../../../common/auth';

export class AddOrganizationMembershipDto {
  @IsUUID()
  userId!: string;

  @IsEnum(PlatformRole)
  role!: PlatformRole;
}

