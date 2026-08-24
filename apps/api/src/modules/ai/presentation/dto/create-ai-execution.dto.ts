import { IsOptional, IsString } from 'class-validator';

export class CreateAiExecutionDto {
  input!: unknown;

  @IsString()
  @IsOptional()
  modelConfigId?: string;
}