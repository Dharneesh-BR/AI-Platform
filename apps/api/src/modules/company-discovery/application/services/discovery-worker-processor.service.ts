import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import type { DiscoveryJobPayload } from '../../../discovery-jobs/application/ports/discovery-job.payload';
import {
  DISCOVERY_EXECUTION_REPOSITORY,
  type DiscoveryExecutionRepository,
  type DiscoveryStepUpdate,
} from '../../../discovery-jobs/application/ports/discovery-execution.repository';
import {
  DISCOVERY_OUTPUT_REPOSITORY,
  type DiscoveryOutputRepository,
  type PersistDiscoveryOutputInput,
} from '../ports/discovery-output.repository';

@Injectable()
export class DiscoveryWorkerProcessorService {
  private readonly logger = new Logger(DiscoveryWorkerProcessorService.name);

  private readonly steps: DiscoveryStepUpdate[] = [
    { key: 'read_website', label: 'Reading website', status: 'PENDING' },
    { key: 'find_products', label: 'Finding products', status: 'PENDING' },
    { key: 'understand_services', label: 'Understanding services', status: 'PENDING' },
    { key: 'detect_competitors', label: 'Detecting competitors', status: 'PENDING' },
    { key: 'build_profile', label: 'Building company profile', status: 'PENDING' },
    { key: 'create_knowledge', label: 'Creating knowledge base', status: 'PENDING' },
    { key: 'prepare_workspace', label: 'Preparing AI workspace', status: 'PENDING' },
  ];

  constructor(
    @Inject(DISCOVERY_EXECUTION_REPOSITORY)
    private readonly discoveryExecutionRepository: DiscoveryExecutionRepository,
    @Inject(DISCOVERY_OUTPUT_REPOSITORY)
    private readonly discoveryOutputRepository: DiscoveryOutputRepository,
  ) {}

  async process(job: Job<DiscoveryJobPayload>): Promise<void> {
    const payload = job.data;
    const state = this.steps.map((step) => ({ ...step }));

    try {
      await this.discoveryExecutionRepository.markRunning(payload.discoveryJobId, 'read_website');
      await this.completeStep(payload.discoveryJobId, state, 'read_website', 15);
      await this.completeStep(payload.discoveryJobId, state, 'find_products', 30);
      await this.completeStep(payload.discoveryJobId, state, 'understand_services', 45);
      await this.completeStep(payload.discoveryJobId, state, 'detect_competitors', 60);
      const output = this.buildDiscoveryOutput(payload);
      await this.completeStep(payload.discoveryJobId, state, 'build_profile', 78);
      await this.discoveryOutputRepository.persist(output);
      await this.completeStep(payload.discoveryJobId, state, 'create_knowledge', 92);
      await this.completeStep(payload.discoveryJobId, state, 'prepare_workspace', 99);
      await this.discoveryExecutionRepository.markCompleted(payload.discoveryJobId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown discovery failure.';
      this.logger.error(message, error instanceof Error ? error.stack : undefined);
      await this.discoveryExecutionRepository.markFailed(payload.discoveryJobId, message);
      throw error;
    }
  }

  private async completeStep(
    discoveryJobId: string,
    steps: DiscoveryStepUpdate[],
    stepKey: string,
    progress: number,
  ): Promise<void> {
    for (const step of steps) {
      if (step.key === stepKey) {
        step.status = 'SUCCEEDED';
      }
    }

    await this.discoveryExecutionRepository.updateProgress(discoveryJobId, progress, stepKey, steps);
  }

  private buildDiscoveryOutput(payload: DiscoveryJobPayload): PersistDiscoveryOutputInput {
    const companyName = payload.companyName ?? 'Discovered Company';
    const primaryChallenges = payload.primaryChallenges?.length
      ? payload.primaryChallenges
      : ['Fragmented knowledge', 'Slow manual research', 'Inconsistent strategic outputs'];
    const businessGoals = payload.businessGoals?.length
      ? payload.businessGoals
      : ['Increase research throughput', 'Improve AI-assisted consulting quality'];

    return {
      organizationId: payload.organizationId,
      projectId: payload.projectId,
      actorUserId: payload.actorUserId ?? null,
      companyName,
      industry: payload.industry ?? 'Unknown',
      mission: `Help ${companyName} convert company context into evidence-backed strategic action.`,
      vision: `Build a repeatable, AI-assisted strategy operating system for ${companyName}.`,
      products: ['AI strategy advisory', 'Market research workspace', 'Company-aware consulting reports'],
      services: ['Research planning', 'Competitor analysis', 'Business strategy synthesis'],
      targetCustomers: ['Executive teams', 'Consulting teams', 'Growth leaders'],
      competitors: (payload.competitors?.length ? payload.competitors : ['Traditional consulting firms']).map(
        (competitor) => ({ name: competitor }),
      ),
      goals: businessGoals.map((goal) => ({ title: goal })),
      technologies: [
        { name: 'Website', category: 'Digital presence', confidence: 0.75 },
        { name: 'AI consulting workflow', category: 'Operating model', confidence: 0.7 },
      ],
      painPoints: primaryChallenges,
      uniqueSellingProposition: 'Company-aware AI consulting workflows grounded in approved project context.',
      summaries: {
        executiveSummary: `${companyName} is ready for company-aware AI research after onboarding and discovery.`,
        discoveryMethod: 'Generated from onboarding inputs and queued discovery pipeline.',
      },
      sourceMetadata: {
        websiteUrl: payload.websiteUrl,
        discoveryJobId: payload.discoveryJobId,
        generatedBy: 'DiscoveryWorkerProcessorService',
      },
    };
  }
}
