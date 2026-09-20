import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class AgentChatDto {
  @IsString()
  @MinLength(2)
  message!: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;
}
