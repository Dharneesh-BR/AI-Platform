import { Injectable } from '@nestjs/common';
import { SupervisorOutputSchema, type AgentCapability, type BusinessAgentProfileView, type SupervisorOutput } from './agent-runtime.types';

@Injectable()
export class SupervisorService {
  classify(input: { userInput: string; businessAgent: BusinessAgentProfileView }): SupervisorOutput {
    const text = input.userInput.toLowerCase();
    const requiredCapabilities = new Set<AgentCapability>();

    if (this.matches(text, ['document', 'uploaded', 'company profile', 'company information', 'available company', 'policy', 'based on our', 'using our'])) {
      requiredCapabilities.add('rag');
    }
    if (this.matches(text, ['calculate', 'growth', 'percent', '%', 'scenario', 'forecast', 'roi', 'margin'])) {
      requiredCapabilities.add('calculation');
    }
    if (this.matches(text, ['plan', 'strategy', 'prioritize', 'compare', 'risk', 'opportunities', 'analyze', 'review'])) {
      requiredCapabilities.add('analysis');
    }
    if (this.matches(text, ['summary', 'email', 'report', 'stakeholder', 'write', 'draft', 'recommend'])) {
      requiredCapabilities.add('writing');
    }

    if (requiredCapabilities.size === 0) {
      requiredCapabilities.add('analysis');
      requiredCapabilities.add('writing');
    }

    const allowed = new Set(input.businessAgent.capabilities);
    const boundedCapabilities = [...requiredCapabilities].filter((capability) => allowed.size === 0 || allowed.has(capability));
    const wordCount = input.userInput.trim().split(/\s+/).filter(Boolean).length;
    const highRisk = input.businessAgent.slug === 'legal' || this.matches(text, ['legal', 'compliance', 'financial risk', 'contract']);
    const complexity = wordCount > 35 || boundedCapabilities.length >= 3 ? 'complex' : boundedCapabilities.length >= 2 ? 'standard' : 'simple';

    return SupervisorOutputSchema.parse({
      intent: this.inferIntent(text, input.businessAgent),
      complexity,
      requiresPlanning: complexity !== 'simple',
      requiredCapabilities: boundedCapabilities.length > 0 ? boundedCapabilities : ['analysis'],
      needsCompanyKnowledge: boundedCapabilities.includes('rag'),
      needsExternalResearch: this.matches(text, ['latest', 'market research', 'competitor news', 'web research']),
      needsCalculation: boundedCapabilities.includes('calculation'),
      riskLevel: highRisk ? 'high' : complexity === 'complex' ? 'medium' : 'low',
    });
  }

  private inferIntent(text: string, businessAgent: BusinessAgentProfileView): string {
    if (text.includes('prioritize')) {
      return `${businessAgent.department} prioritization`;
    }
    if (text.includes('risk')) {
      return `${businessAgent.department} risk analysis`;
    }
    if (text.includes('plan')) {
      return `${businessAgent.department} implementation planning`;
    }
    return `${businessAgent.department} advisory response`;
  }

  private matches(text: string, keywords: string[]): boolean {
    return keywords.some((keyword) => text.includes(keyword));
  }
}
