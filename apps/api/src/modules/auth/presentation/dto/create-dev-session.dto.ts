import { IsEnum } from 'class-validator';
import { PlatformRole } from '../../../../common/auth';

export class CreateDevSessionDto {
  @IsEnum(PlatformRole)
  role!: PlatformRole;
}
