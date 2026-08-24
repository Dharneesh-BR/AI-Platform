import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateResearchPlanDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(10)
  question!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  objectives?: string[];
}