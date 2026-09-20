import type { AgentCapability, SpecialistExecutionInput, SpecialistExecutionResult } from '../agent-runtime.types';

export interface AgentSpecialist {
  readonly capability: AgentCapability;
  readonly requiredPermissions: string[];
  readonly supportedTools: string[];
  execute(input: SpecialistExecutionInput): Promise<SpecialistExecutionResult>;
}
