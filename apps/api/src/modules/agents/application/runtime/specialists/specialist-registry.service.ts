import { BadRequestException, Injectable } from '@nestjs/common';
import type { AgentCapability, BusinessAgentProfileView } from '../agent-runtime.types';
import { AnalysisSpecialist } from './analysis.specialist';
import { CalculationSpecialist } from './calculation.specialist';
import { DocumentSpecialist } from './document.specialist';
import { RagSpecialist } from './rag.specialist';
import { ResearchSpecialist } from './research.specialist';
import type { AgentSpecialist } from './specialist.interface';
import { WritingSpecialist } from './writing.specialist';

@Injectable()
export class SpecialistRegistryService {
  private readonly specialists: AgentSpecialist[];

  constructor(
    ragSpecialist: RagSpecialist,
    researchSpecialist: ResearchSpecialist,
    analysisSpecialist: AnalysisSpecialist,
    writingSpecialist: WritingSpecialist,
    calculationSpecialist: CalculationSpecialist,
    documentSpecialist: DocumentSpecialist,
  ) {
    this.specialists = [ragSpecialist, researchSpecialist, analysisSpecialist, writingSpecialist, calculationSpecialist, documentSpecialist];
  }

  get(capability: AgentCapability, businessAgent: BusinessAgentProfileView): AgentSpecialist {
    const specialist = this.specialists.find((candidate) => candidate.capability === capability);

    if (!specialist) {
      throw new BadRequestException(`No specialist is registered for '${capability}'.`);
    }

    if (businessAgent.allowedSpecialists.length > 0 && !businessAgent.allowedSpecialists.includes(capability)) {
      throw new BadRequestException(`The '${businessAgent.name}' profile is not allowed to use '${capability}'.`);
    }

    return specialist;
  }

  list(): Array<Pick<AgentSpecialist, 'capability' | 'requiredPermissions' | 'supportedTools'>> {
    return this.specialists.map((specialist) => ({
      capability: specialist.capability,
      requiredPermissions: specialist.requiredPermissions,
      supportedTools: specialist.supportedTools,
    }));
  }
}
