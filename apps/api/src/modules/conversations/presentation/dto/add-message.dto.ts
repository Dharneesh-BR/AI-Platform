import { IsOptional, IsString, MinLength } from 'class-validator';

export class AddMessageDto {
  @IsString()
  @MinLength(2)
  content!: string;

  @IsOptional()
  @IsString()
  agentSlug?: string;
}
