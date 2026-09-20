import { Body, Controller, NotFoundException, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../../../common/auth';
import { LiteLlmGatewayService } from '../../application/services/litellm-gateway.service';
import { TestLlmDto } from '../dto/test-llm.dto';

@ApiTags('LLM')
@Controller('llm')
export class LlmController {
  constructor(
    private readonly liteLlmGateway: LiteLlmGatewayService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('test')
  async test(@Body() dto: TestLlmDto) {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new NotFoundException();
    }

    const result = await this.liteLlmGateway.chat(dto.message, {
      model: dto.model,
      systemPrompt: dto.systemPrompt,
      temperature: dto.temperature,
      maxTokens: dto.maxTokens,
    });

    return {
      success: true,
      model: result.model,
      response: result.content,
      usage: result.usage,
    };
  }
}
