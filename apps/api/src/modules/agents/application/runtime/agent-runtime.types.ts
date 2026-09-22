import { z } from 'zod';

export const AgentCapabilitySchema = z.enum(['rag', 'research', 'analysis', 'writing', 'calculation', 'document', 'planning']);
export type AgentCapability = z.infer<typeof AgentCapabilitySchema>;

export const ComplexitySchema = z.enum(['simple', 'standard', 'complex']);
export type AgentComplexity = z.infer<typeof ComplexitySchema>;

export const RiskLevelSchema = z.enum(['low', 'medium', 'high']);
export type AgentRiskLevel = z.infer<typeof RiskLevelSchema>;

export const SupervisorOutputSchema = z.object({
  intent: z.string().min(1),
  complexity: ComplexitySchema,
  requiresPlanning: z.boolean(),
  requiredCapabilities: z.array(AgentCapabilitySchema),
  needsCompanyKnowledge: z.boolean(),
  needsExternalResearch: z.boolean(),
  needsCalculation: z.boolean(),
  riskLevel: RiskLevelSchema,
});
export type SupervisorOutput = z.infer<typeof SupervisorOutputSchema>;

export const PlanStepSchema = z.object({
  id: z.string().min(1),
  goal: z.string().min(1),
  capability: AgentCapabilitySchema,
  dependencies: z.array(z.string()).default([]),
});

export const TaskPlanSchema = z.object({
  objective: z.string().min(1),
  steps: z.array(PlanStepSchema),
});
export type TaskPlan = z.infer<typeof TaskPlanSchema>;
export type TaskPlanStep = z.infer<typeof PlanStepSchema>;

export const VerificationResultSchema = z.object({
  passed: z.boolean(),
  score: z.number().min(0).max(1),
  issues: z.array(z.string()).default([]),
  recommendedAction: z.enum(['accept', 'revise', 'replan']),
});
export type VerificationResult = z.infer<typeof VerificationResultSchema>;

export interface BusinessAgentProfileView {
  id?: string;
  source?: 'database' | 'sanity';
  name: string;
  slug: string;
  department: string;
  description?: string | null;
  systemInstructions: string;
  responseFormatInstructions?: string | null;
  outputSections?: Array<{
    heading: string;
    instructions: string;
    required?: boolean;
  }>;
  capabilities: AgentCapability[];
  allowedSpecialists: string[];
  allowedTools: string[];
  knowledgeScopes: string[];
  modelPolicy: Record<string, unknown>;
  verificationPolicy: Record<string, unknown>;
  enabled: boolean;
}

export interface AgentSourceReference {
  documentId: string;
  documentName: string;
  chunkId: string;
  pageNumber?: number | null;
  similarity?: number;
}

export interface SpecialistExecutionInput {
  runId: string;
  agentStepId?: string;
  projectId: string;
  userId: string;
  permissions: string[];
  userInput: string;
  businessAgent: BusinessAgentProfileView;
  companyContext: string;
  planStep?: TaskPlanStep;
  selectedModel?: string;
}

export interface SpecialistExecutionResult {
  capability: AgentCapability;
  content: string;
  sources?: AgentSourceReference[];
  metadata?: Record<string, unknown>;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface AgentRuntimeInput {
  projectId: string;
  userId: string;
  conversationId?: string;
  userInput: string;
  agentSlug?: string;
}

export interface AgentRuntimeResult {
  runId: string;
  answer: string;
  agentSlug: string;
  agentName: string;
  sources: AgentSourceReference[];
  verification?: VerificationResult;
  model?: string;
  totalTokens?: number;
}

export interface AgentGraphState {
  runId: string;
  projectId: string;
  userId: string;
  permissions: string[];
  conversationId?: string;
  businessAgentId?: string;
  agentSlug: string;
  userInput: string;
  companyContext: string;
  retrievedKnowledge: string;
  intent: string;
  complexity: AgentComplexity;
  plan?: TaskPlan;
  currentStep?: string;
  completedSteps: string[];
  toolResults: Record<string, unknown>;
  specialistResults: SpecialistExecutionResult[];
  selectedModels: Record<string, string>;
  verification?: VerificationResult;
  finalAnswer: string;
  sources: AgentSourceReference[];
  errors: string[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  businessAgent?: BusinessAgentProfileView;
  supervisor?: SupervisorOutput;
  verificationAttempts: number;
}
