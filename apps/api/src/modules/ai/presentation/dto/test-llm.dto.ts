import { IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class TestLlmDto {
  @IsString()
  @MaxLength(4000)
  message!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  systemPrompt?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  model?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(4000)
  maxTokens?: number;
}
