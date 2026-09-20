import { Module } from '@nestjs/common';
import { QueueModule } from '../../common/queue/queue.module';
import { AiModule } from '../ai/ai.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { AgentsService } from './application/agents.service';
import { AgentExecutionWorker } from './infrastructure/queues/agent-execution.worker';
import { AgentContextService } from './application/runtime/agent-context.service';
import { AgentRuntimeConfigService } from './application/runtime/agent-runtime-config.service';
import { AgentRuntimeService } from './application/runtime/agent-runtime.service';
import { BusinessAgentProfileService } from './application/runtime/business-agent-profile.service';
import { ModelRouterService } from './application/runtime/model-router.service';
import { AnalysisSpecialist } from './application/runtime/specialists/analysis.specialist';
import { CalculationSpecialist } from './application/runtime/specialists/calculation.specialist';
import { DocumentSpecialist } from './application/runtime/specialists/document.specialist';
import { RagSpecialist } from './application/runtime/specialists/rag.specialist';
import { SanityAgentProfileClient } from './application/runtime/sanity-agent-profile.client';
import { ResearchSpecialist } from './application/runtime/specialists/research.specialist';
import { SpecialistRegistryService } from './application/runtime/specialists/specialist-registry.service';
import { WritingSpecialist } from './application/runtime/specialists/writing.specialist';
import { SupervisorService } from './application/runtime/supervisor.service';
import { TaskPlannerService } from './application/runtime/task-planner.service';
import { ToolAuthorizationService } from './application/runtime/tools/tool-authorization.service';
import { ToolRegistryService } from './application/runtime/tools/tool-registry.service';
import { VerificationService } from './application/runtime/verification.service';
import { AgentsController } from './presentation/controllers/agents.controller';

@Module({
  imports: [AiModule, KnowledgeBaseModule, QueueModule],
  controllers: [AgentsController],
  providers: [
    AgentContextService,
    AgentExecutionWorker,
    AgentRuntimeConfigService,
    AgentRuntimeService,
    AgentsService,
    AnalysisSpecialist,
    BusinessAgentProfileService,
    CalculationSpecialist,
    DocumentSpecialist,
    ModelRouterService,
    RagSpecialist,
    ResearchSpecialist,
    SanityAgentProfileClient,
    SpecialistRegistryService,
    SupervisorService,
    TaskPlannerService,
    ToolAuthorizationService,
    ToolRegistryService,
    VerificationService,
    WritingSpecialist,
  ],
  exports: [AgentRuntimeService, BusinessAgentProfileService, AgentsService],
})
export class AgentsModule {}
