import { IsArray, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CreateReportSectionDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(2)
  kind!: string;

  content!: unknown;
}

export class CreateReportDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReportSectionDto)
  @IsOptional()
  sections?: CreateReportSectionDto[];
}