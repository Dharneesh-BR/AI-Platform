import { Injectable } from '@nestjs/common';
import { VerificationResultSchema, type AgentGraphState, type VerificationResult } from './agent-runtime.types';

@Injectable()
export class VerificationService {
  verify(state: AgentGraphState): VerificationResult {
    const issues: string[] = [];

    if (!state.finalAnswer.trim()) {
      issues.push('No final answer was produced.');
    }
    if (state.supervisor?.needsCompanyKnowledge && state.sources.length === 0) {
      issues.push('The request appears to need company knowledge, but no relevant document sources were retrieved.');
    }
    if (state.supervisor?.riskLevel === 'high' && state.finalAnswer.toLowerCase().includes('guarantee')) {
      issues.push('High-risk response contains overconfident language.');
    }
    if (state.businessAgent?.slug === 'legal' && !state.finalAnswer.toLowerCase().includes('not legal advice')) {
      issues.push('Legal agent response is missing the required non-legal-advice caveat.');
    }
    for (const section of state.businessAgent?.outputSections ?? []) {
      if (section.required === false) {
        continue;
      }
      if (!state.finalAnswer.toLowerCase().includes(section.heading.toLowerCase())) {
        issues.push(`Response is missing the required '${section.heading}' section.`);
      }
    }

    const requiredPhrases = state.businessAgent?.verificationPolicy.requiredPhrases;
    if (Array.isArray(requiredPhrases)) {
      for (const phrase of requiredPhrases) {
        if (typeof phrase === 'string' && phrase.trim() && !state.finalAnswer.toLowerCase().includes(phrase.trim().toLowerCase())) {
          issues.push(`Response is missing required phrase: ${phrase}.`);
        }
      }
    }

    const passed = issues.length === 0;
    return VerificationResultSchema.parse({
      passed,
      score: passed ? 0.92 : 0.65,
      issues,
      recommendedAction: passed ? 'accept' : 'revise',
    });
  }
}
