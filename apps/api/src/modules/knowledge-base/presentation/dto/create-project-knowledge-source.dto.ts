import { ResearchSourceType } from '@prisma/client';
import { IsEnum, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProjectKnowledgeSourceDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsString()
  @MinLength(10)
  content!: string;

  @IsEnum(ResearchSourceType)
  @IsOptional()
  type?: ResearchSourceType;

  @IsString()
  @IsOptional()
  sourceId?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
