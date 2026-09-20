import { Module } from '@nestjs/common';
import { AiService } from './application/ai.service';
import { LiteLlmGatewayService } from './application/services/litellm-gateway.service';
import { AiController } from './presentation/controllers/ai.controller';
import { LlmController } from './presentation/controllers/llm.controller';

@Module({
  controllers: [AiController, LlmController],
  providers: [AiService, LiteLlmGatewayService],
  exports: [AiService, LiteLlmGatewayService],
})
export class AiModule {}
