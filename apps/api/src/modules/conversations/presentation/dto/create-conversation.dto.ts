import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @MinLength(3)
  @IsOptional()
  title?: string;
}