export const DISCOVERY_EXECUTION_REPOSITORY = Symbol('DISCOVERY_EXECUTION_REPOSITORY');

export interface DiscoveryStepUpdate {
  key: string;
  label: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'SKIPPED';
}

export interface DiscoveryExecutionRepository {
  markRunning(discoveryJobId: string, currentStep: string): Promise<void>;
  updateProgress(
    discoveryJobId: string,
    progress: number,
    currentStep: string,
    steps: DiscoveryStepUpdate[],
  ): Promise<void>;
  markCompleted(discoveryJobId: string): Promise<void>;
  markFailed(discoveryJobId: string, errorMessage: string): Promise<void>;
}