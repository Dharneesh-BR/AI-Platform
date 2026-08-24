import { AgentType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class CreateAgentRunDto {
  @IsEnum(AgentType)
  agentType!: AgentType;

  @IsOptional()
  state?: unknown;
}