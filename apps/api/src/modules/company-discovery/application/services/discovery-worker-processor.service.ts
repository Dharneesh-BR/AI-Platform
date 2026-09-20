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
import { DiscoveryOrchestratorService } from './discovery-orchestrator.service';

interface WebsiteDiscoverySnapshot {
  websiteUrl: string;
  metadata: Record<string, unknown>;
  navigation: string[];
  productsOrServices: string[];
  technologies: string[];
  initialSummary: Record<string, unknown>;
  textSample: string;
  error?: string;
}

@Injectable()
export class DiscoveryWorkerProcessorService {
  private readonly logger = new Logger(DiscoveryWorkerProcessorService.name);

  private readonly steps: DiscoveryStepUpdate[] = [
    { key: 'read_website', label: 'Reading website', status: 'PENDING' },
    { key: 'find_products', label: 'Finding products', status: 'PENDING' },
    { key: 'understand_services', label: 'Understanding services', status: 'PENDING' },
    { key: 'detect_competitors', label: 'Detecting competitors', status: 'PENDING' },
    { key: 'build_profile', label: 'Building company profile', status: 'PENDING' },
    { key: 'save_context', label: 'Saving project context', status: 'PENDING' },
    { key: 'prepare_workspace', label: 'Preparing AI workspace', status: 'PENDING' },
  ];

  constructor(
    @Inject(DISCOVERY_EXECUTION_REPOSITORY)
    private readonly discoveryExecutionRepository: DiscoveryExecutionRepository,
    @Inject(DISCOVERY_OUTPUT_REPOSITORY)
    private readonly discoveryOutputRepository: DiscoveryOutputRepository,
    private readonly discoveryOrchestratorService: DiscoveryOrchestratorService,
  ) {}

  async process(job: Job<DiscoveryJobPayload>): Promise<void> {
    await this.processPayload(job.data);
  }

  async processPayload(payload: DiscoveryJobPayload): Promise<void> {
    const state = this.steps.map((step) => ({ ...step }));

    try {
      await this.discoveryExecutionRepository.markRunning(payload.discoveryJobId, 'read_website');
      await this.completeStep(payload.discoveryJobId, state, 'read_website', 15);
      const websiteDiscovery = await this.discoverWebsite(payload);
      await this.completeStep(payload.discoveryJobId, state, 'find_products', 30);
      await this.completeStep(payload.discoveryJobId, state, 'understand_services', 45);
      await this.completeStep(payload.discoveryJobId, state, 'detect_competitors', 60);
      const output = this.buildDiscoveryOutput(payload, websiteDiscovery);
      await this.completeStep(payload.discoveryJobId, state, 'build_profile', 78);
      await this.discoveryOutputRepository.persist(output);
      await this.completeStep(payload.discoveryJobId, state, 'save_context', 92);
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

  private async discoverWebsite(payload: DiscoveryJobPayload): Promise<WebsiteDiscoverySnapshot | null> {
    if (!payload.websiteUrl?.trim()) {
      return null;
    }

    try {
      const response = await fetch(payload.websiteUrl, {
        headers: {
          'user-agent': 'MagnaficAI-Discovery/1.0 (+https://magnafic.ai)',
          accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(12_000),
      });

      if (!response.ok) {
        return {
          websiteUrl: payload.websiteUrl,
          metadata: {},
          navigation: [],
          productsOrServices: [],
          technologies: [],
          initialSummary: {},
          textSample: '',
          error: `Website returned ${response.status}`,
        };
      }

      const html = await response.text();
      const headers = Object.fromEntries(response.headers.entries());
      const prepared = this.discoveryOrchestratorService.prepareWebsiteDiscovery({
        companyName: payload.companyName ?? 'Discovered Company',
        websiteUrl: payload.websiteUrl,
        industry: payload.industry,
        html,
        headers,
      });

      return {
        websiteUrl: String(prepared.websiteUrl ?? payload.websiteUrl),
        metadata: this.asRecord(prepared.metadata),
        navigation: this.asStringArray(prepared.navigation),
        productsOrServices: this.asStringArray(prepared.productsOrServices),
        technologies: this.asStringArray(prepared.technologies),
        initialSummary: this.asRecord(prepared.initialSummary),
        textSample: html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1200),
      };
    } catch (error) {
      return {
        websiteUrl: payload.websiteUrl,
        metadata: {},
        navigation: [],
        productsOrServices: [],
        technologies: [],
        initialSummary: {},
        textSample: '',
        error: error instanceof Error ? error.message : 'Website discovery failed',
      };
    }
  }

  private buildDiscoveryOutput(
    payload: DiscoveryJobPayload,
    websiteDiscovery: WebsiteDiscoverySnapshot | null,
  ): PersistDiscoveryOutputInput {
    const companyName = payload.companyName ?? 'Discovered Company';
    const primaryChallenges = payload.primaryChallenges?.length
      ? payload.primaryChallenges
      : ['Fragmented knowledge', 'Slow manual research', 'Inconsistent strategic outputs'];
    const businessGoals = payload.businessGoals?.length
      ? payload.businessGoals
      : ['Increase research throughput', 'Improve AI-assisted consulting quality'];
    const discoveredOfferings = websiteDiscovery?.productsOrServices?.length
      ? websiteDiscovery.productsOrServices.map((item) => this.cleanLine(item)).filter(Boolean).slice(0, 8)
      : [];
    const navSignals = websiteDiscovery?.navigation?.length
      ? websiteDiscovery.navigation.map((item) => this.cleanLine(item)).filter(Boolean).slice(0, 12)
      : [];
    const metadataDescription = typeof websiteDiscovery?.metadata.description === 'string'
      ? websiteDiscovery.metadata.description
      : null;
    const websiteTitle = typeof websiteDiscovery?.metadata.title === 'string'
      ? websiteDiscovery.metadata.title
      : null;
    const products = discoveredOfferings.length
      ? discoveredOfferings.slice(0, 5)
      : [payload.industry ? `${payload.industry} offering` : `${companyName} offering`];
    const services = navSignals.length
      ? navSignals.slice(0, 5)
      : ['Customer support', 'Sales assistance', 'Business operations'];

    return {
      organizationId: payload.organizationId,
      projectId: payload.projectId,
      actorUserId: payload.actorUserId ?? null,
      companyName,
      industry: payload.industry ?? 'Unknown',
      mission: metadataDescription ?? `${companyName} is being profiled from its onboarding context and public website.`,
      vision: `Build a clearer market, customer, and growth picture for ${companyName} using public discovery and project context.`,
      products,
      services,
      targetCustomers: this.inferTargetCustomers(payload.industry, websiteDiscovery),
      competitors: (payload.competitors?.length ? payload.competitors : ['Traditional consulting firms']).map(
        (competitor) => ({ name: competitor }),
      ),
      goals: businessGoals.map((goal) => ({ title: goal })),
      technologies: [
        { name: 'Website', category: 'Digital presence', confidence: 0.75 },
        ...(websiteDiscovery?.technologies ?? []).map((technology) => ({
          name: technology,
          category: 'Detected website technology',
          confidence: 0.8,
        })),
      ],
      painPoints: primaryChallenges,
      uniqueSellingProposition:
        metadataDescription ??
        `${companyName} can use its public positioning and project context to prioritize practical growth actions.`,
      summaries: {
        executiveSummary: `${companyName} has an initial company profile generated from onboarding basics${websiteDiscovery ? ' and public website discovery' : ''}.`,
        discoveryMethod: 'Generated from onboarding inputs and public website extraction when available.',
        websiteTitle,
        websiteDescription: metadataDescription,
        websiteSignals: navSignals,
        websiteError: websiteDiscovery?.error,
      },
      sourceMetadata: {
        websiteUrl: websiteDiscovery?.websiteUrl ?? payload.websiteUrl,
        discoveryJobId: payload.discoveryJobId,
        websiteTextSample: websiteDiscovery?.textSample,
        generatedBy: 'DiscoveryWorkerProcessorService',
      },
    };
  }

  private inferTargetCustomers(
    industry?: string | null,
    websiteDiscovery?: WebsiteDiscoverySnapshot | null,
  ): string[] {
    const text = `${industry ?? ''} ${(websiteDiscovery?.textSample ?? '').toLowerCase()}`;

    if (/cycle|bicycle|bike|mobility/.test(text)) {
      return ['Cycling customers', 'Urban mobility buyers', 'Local service customers'];
    }

    if (/school|course|learn|student|education/.test(text)) {
      return ['Students', 'Learners', 'Training teams'];
    }

    if (/clinic|health|medical|patient/.test(text)) {
      return ['Patients', 'Healthcare customers', 'Care teams'];
    }

    return ['Prospective customers', 'Existing customers', 'Growth-focused decision makers'];
  }

  private cleanLine(value: string): string {
    return value.replace(/\s+/g, ' ').trim().slice(0, 140);
  }

  private asStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  }
}
