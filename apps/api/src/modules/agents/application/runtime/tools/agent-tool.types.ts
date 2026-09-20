import type { z } from 'zod';
import type { BusinessAgentProfileView } from '../agent-runtime.types';

export type ToolCategory =
  | 'knowledge'
  | 'company'
  | 'reports'
  | 'calculation'
  | 'research'
  | 'email'
  | 'calendar'
  | 'crm'
  | 'erp'
  | 'files'
  | 'finance'
  | 'hr'
  | 'admin';

export type ToolRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AgentToolDefinition<TInput = unknown> {
  name: string;
  description: string;
  category: ToolCategory;
  inputSchema: z.ZodType<TInput>;
  requiredPermissions: string[];
  allowedAgentCapabilities: string[];
  riskLevel: ToolRiskLevel;
  mutating: boolean;
  enabled: boolean;
  requiresApproval?: boolean;
}

export interface ToolExecutionContext {
  userId: string;
  organizationId: string;
  projectId: string;
  agentRunId: string;
  agentStepId?: string;
  agentProfileId?: string;
  agentSlug: string;
  businessAgent: BusinessAgentProfileView;
  permissions: string[];
  knowledgeScopes?: string[];
}

export interface ToolExecutionResult<TData = unknown> {
  ok: boolean;
  data?: TData;
  sources?: unknown[];
  errorCode?: string;
}
