import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpsertProjectProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  companyName!: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  websiteUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  industry?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  companySize?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  businessModel?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  targetMarket?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(25)
  @IsString({ each: true })
  businessGoals?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(25)
  @IsString({ each: true })
  primaryChallenges?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(25)
  @IsString({ each: true })
  competitors?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  onboardingStep?: string | null;
}

