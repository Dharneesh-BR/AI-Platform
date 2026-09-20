import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @MinLength(3)
  @IsOptional()
  title?: string;

  @IsString()
  @MinLength(2)
  @IsOptional()
  agentSlug?: string;
}
