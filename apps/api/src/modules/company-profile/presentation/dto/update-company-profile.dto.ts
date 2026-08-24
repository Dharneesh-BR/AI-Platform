import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCompanyProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  mission?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  vision?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  industry?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  targetCustomers?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  products?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  services?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  painPoints?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  uniqueSellingProposition?: string | null;
}