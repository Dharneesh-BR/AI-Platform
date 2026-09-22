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
import { LiteLlmGatewayService } from '../../../ai/application/services/litellm-gateway.service';
import { DiscoveryOrchestratorService } from './discovery-orchestrator.service';

interface DiscoveredPage {
  url: string;
  title?: string | null;
  description?: string | null;
  navigation: string[];
  productsOrServices: string[];
  technologies: string[];
  textSample: string;
}

interface WebsiteDiscoverySnapshot {
  websiteUrl: string;
  pages: DiscoveredPage[];
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
    private readonly liteLlmGateway: LiteLlmGatewayService,
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
      const output = await this.buildDiscoveryOutput(payload, websiteDiscovery);
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
      const startUrl = this.normalizePublicUrl(payload.websiteUrl);
      const homepage = await this.fetchDiscoveredPage(startUrl);
      const candidateUrls = this.selectFollowUpUrls(startUrl, homepage.html);
      const followUpPages = await Promise.all(candidateUrls.map((url) => this.fetchDiscoveredPage(url).catch(() => null)));
      const pages = [homepage, ...followUpPages.filter((page): page is Awaited<ReturnType<DiscoveryWorkerProcessorService['fetchDiscoveredPage']>> => Boolean(page))]
        .map((page) => page.snapshot);
      const prepared = this.mergePages(startUrl, pages);

      return {
        websiteUrl: startUrl,
        pages,
        metadata: prepared.metadata,
        navigation: prepared.navigation,
        productsOrServices: prepared.productsOrServices,
        technologies: prepared.technologies,
        initialSummary: prepared.initialSummary,
        textSample: pages.map((page) => page.textSample).join('\n\n').slice(0, 4000),
      };
    } catch (error) {
      return {
        websiteUrl: payload.websiteUrl,
        pages: [],
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

  private async fetchDiscoveredPage(url: string): Promise<{ html: string; snapshot: DiscoveredPage }> {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'MagnaficAI-Discovery/1.0 (+https://magnafic.ai)',
        accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      throw new Error(`Website returned ${response.status} for ${url}`);
    }

    const html = await response.text();
    const headers = Object.fromEntries(response.headers.entries());
    const prepared = this.discoveryOrchestratorService.prepareWebsiteDiscovery({
      companyName: 'Discovered Company',
      websiteUrl: url,
      html,
      headers,
    });
    const metadata = this.asRecord(prepared.metadata);

    return {
      html,
      snapshot: {
        url,
        title: typeof metadata.title === 'string' ? metadata.title : null,
        description: typeof metadata.description === 'string' ? metadata.description : null,
        navigation: this.asStringArray(prepared.navigation),
        productsOrServices: this.asStringArray(prepared.productsOrServices),
        technologies: this.asStringArray(prepared.technologies),
        textSample: this.extractReadableText(html).slice(0, 1600),
      },
    };
  }

  private async buildDiscoveryOutput(
    payload: DiscoveryJobPayload,
    websiteDiscovery: WebsiteDiscoverySnapshot | null,
  ): Promise<PersistDiscoveryOutputInput> {
    const companyName = payload.companyName ?? 'Discovered Company';
    const aiProfile = await this.generateAiProfile(payload, websiteDiscovery);
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
    const products = aiProfile.products.length
      ? aiProfile.products
      : discoveredOfferings.length
      ? discoveredOfferings.slice(0, 5)
      : [payload.industry ? `${payload.industry} offering` : `${companyName} offering`];
    const services = aiProfile.services.length
      ? aiProfile.services
      : navSignals.length
      ? navSignals.slice(0, 5)
      : ['Customer support', 'Sales assistance', 'Business operations'];
    const targetCustomers = aiProfile.targetCustomers.length
      ? aiProfile.targetCustomers
      : this.inferTargetCustomers(payload.industry, websiteDiscovery);
    const painPoints = aiProfile.painPoints.length ? aiProfile.painPoints : primaryChallenges;

    return {
      projectId: payload.projectId,
      actorUserId: payload.actorUserId ?? null,
      companyName,
      industry: payload.industry ?? 'Unknown',
      mission: aiProfile.businessSummary || metadataDescription || `${companyName} is being profiled from its onboarding context and public website.`,
      vision: aiProfile.futureDirection || `Build a clearer market, customer, and growth picture for ${companyName} using public discovery and project context.`,
      products,
      services,
      targetCustomers,
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
      painPoints,
      uniqueSellingProposition:
        aiProfile.positioning ||
        metadataDescription ||
        `${companyName} can use its public positioning and project context to prioritize practical growth actions.`,
      summaries: {
        executiveSummary: aiProfile.executiveSummary || `${companyName} has an initial company profile generated from onboarding basics${websiteDiscovery ? ' and public website discovery' : ''}.`,
        aiReadiness: aiProfile.aiReadiness || 'Ready for first-pass AI opportunity mapping based on onboarding and public discovery.',
        recommendedRoadmap: aiProfile.recommendedRoadmap,
        discoveryMethod: 'Generated from onboarding inputs, same-domain public website extraction, and an LLM profile synthesis when available.',
        websiteTitle,
        websiteDescription: metadataDescription,
        websiteSignals: navSignals,
        crawledPages: websiteDiscovery?.pages.map((page) => ({ url: page.url, title: page.title })) ?? [],
        websiteError: websiteDiscovery?.error,
      },
      sourceMetadata: {
        websiteUrl: websiteDiscovery?.websiteUrl ?? payload.websiteUrl,
        discoveryJobId: payload.discoveryJobId,
        websiteTextSample: websiteDiscovery?.textSample,
        generatedBy: aiProfile.generatedBy,
      },
    };
  }

  private mergePages(startUrl: string, pages: DiscoveredPage[]) {
    const homepage = pages[0];
    return {
      websiteUrl: startUrl,
      metadata: {
        title: homepage?.title,
        description: homepage?.description,
      },
      navigation: this.uniqueStrings(pages.flatMap((page) => page.navigation)).slice(0, 80),
      productsOrServices: this.uniqueStrings(pages.flatMap((page) => page.productsOrServices)).slice(0, 50),
      technologies: this.uniqueStrings(pages.flatMap((page) => page.technologies)).slice(0, 20),
      initialSummary: {},
    };
  }

  private async generateAiProfile(
    payload: DiscoveryJobPayload,
    websiteDiscovery: WebsiteDiscoverySnapshot | null,
  ): Promise<{
    businessSummary: string | null;
    futureDirection: string | null;
    executiveSummary: string | null;
    aiReadiness: string | null;
    products: string[];
    services: string[];
    targetCustomers: string[];
    painPoints: string[];
    positioning: string | null;
    recommendedRoadmap: string[];
    generatedBy: string;
  }> {
    const empty = {
      businessSummary: null,
      futureDirection: null,
      executiveSummary: null,
      aiReadiness: null,
      products: [],
      services: [],
      targetCustomers: [],
      painPoints: [],
      positioning: null,
      recommendedRoadmap: [],
      generatedBy: 'DiscoveryWorkerProcessorService',
    };

    if (!websiteDiscovery?.textSample && !payload.companyName) {
      return empty;
    }

    try {
      const result = await this.liteLlmGateway.generateText({
        temperature: 0.2,
        maxTokens: 1200,
        metadata: {
          feature: 'company-discovery-profile',
          projectId: payload.projectId,
        },
        messages: [
          {
            role: 'system',
            content: [
              'You generate first-pass company report-card data from onboarding and public website text.',
              'Return strict JSON only. Do not wrap in Markdown.',
              'Use only supplied public/onboarding facts. If you infer, keep it conservative and business-useful.',
              'Shape: {"businessSummary":"string","futureDirection":"string","executiveSummary":"string","aiReadiness":"string","products":["string"],"services":["string"],"targetCustomers":["string"],"painPoints":["string"],"positioning":"string","recommendedRoadmap":["string"]}',
            ].join('\n'),
          },
          {
            role: 'user',
            content: [
              `Company name: ${payload.companyName ?? 'Unknown'}`,
              `Website: ${websiteDiscovery?.websiteUrl ?? payload.websiteUrl ?? 'Not provided'}`,
              `Industry from onboarding: ${payload.industry ?? 'Not provided'}`,
              `Business goals from onboarding: ${JSON.stringify(payload.businessGoals ?? [])}`,
              `Primary challenges from onboarding: ${JSON.stringify(payload.primaryChallenges ?? [])}`,
              `Competitors from onboarding: ${JSON.stringify(payload.competitors ?? [])}`,
              `Crawled public pages: ${JSON.stringify(websiteDiscovery?.pages.map((page) => ({ url: page.url, title: page.title, description: page.description })) ?? [])}`,
              `Public website text:\n${websiteDiscovery?.textSample ?? 'No website text available.'}`,
            ].join('\n\n'),
          },
        ],
      });

      const parsed = this.parseJsonObject(result.content);
      return {
        businessSummary: this.asOptionalString(parsed.businessSummary),
        futureDirection: this.asOptionalString(parsed.futureDirection),
        executiveSummary: this.asOptionalString(parsed.executiveSummary),
        aiReadiness: this.asOptionalString(parsed.aiReadiness),
        products: this.asCleanList(parsed.products, 6),
        services: this.asCleanList(parsed.services, 6),
        targetCustomers: this.asCleanList(parsed.targetCustomers, 6),
        painPoints: this.asCleanList(parsed.painPoints, 6),
        positioning: this.asOptionalString(parsed.positioning),
        recommendedRoadmap: this.asCleanList(parsed.recommendedRoadmap, 6),
        generatedBy: `llm:${result.model}`,
      };
    } catch (error) {
      this.logger.warn(`AI discovery synthesis unavailable; using deterministic profile. reason=${error instanceof Error ? error.message : String(error)}`);
      return empty;
    }
  }

  private selectFollowUpUrls(startUrl: string, html: string): string[] {
    const base = new URL(startUrl);
    const preferred = /about|product|service|solution|pricing|contact|shop|catalog|cycle|bike|ebike/i;
    const links = Array.from(html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi))
      .map((match) => this.safeSameOriginUrl(String(match[1]), base))
      .filter((url): url is string => Boolean(url))
      .filter((url) => url !== startUrl);

    const ranked = this.uniqueStrings(links).sort((left, right) => {
      const leftScore = preferred.test(left) ? 0 : 1;
      const rightScore = preferred.test(right) ? 0 : 1;
      return leftScore - rightScore || left.localeCompare(right);
    });

    return ranked.slice(0, 4);
  }

  private safeSameOriginUrl(rawHref: string, base: URL): string | null {
    try {
      if (!rawHref || rawHref.startsWith('#') || /^(mailto|tel|javascript):/i.test(rawHref)) {
        return null;
      }
      const url = new URL(rawHref, base);
      if (url.origin !== base.origin || !['http:', 'https:'].includes(url.protocol)) {
        return null;
      }
      url.hash = '';
      return url.toString();
    } catch {
      return null;
    }
  }

  private normalizePublicUrl(rawUrl: string): string {
    const trimmed = rawUrl.trim();
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);

    if (!['http:', 'https:'].includes(url.protocol) || this.isBlockedHostname(url.hostname)) {
      throw new Error('Website URL must be a public HTTP or HTTPS URL.');
    }

    return url.toString();
  }

  private isBlockedHostname(hostname: string): boolean {
    const normalized = hostname.toLowerCase();
    return (
      normalized === 'localhost' ||
      normalized.endsWith('.localhost') ||
      normalized === '0.0.0.0' ||
      normalized.startsWith('127.') ||
      normalized.startsWith('10.') ||
      normalized.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)
    );
  }

  private extractReadableText(html: string): string {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/\s+/g, ' ')
      .trim();
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

  private asCleanList(value: unknown, limit: number): string[] {
    return this.asStringArray(value)
      .map((item) => this.cleanLine(item))
      .filter(Boolean)
      .slice(0, limit);
  }

  private asOptionalString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim().slice(0, 700) : null;
  }

  private parseJsonObject(content: string): Record<string, unknown> {
    const trimmed = content.trim();
    const json = trimmed.startsWith('{') ? trimmed : trimmed.match(/\{[\s\S]*\}/)?.[0] ?? '{}';
    const parsed = JSON.parse(json) as unknown;
    return this.asRecord(parsed);
  }

  private uniqueStrings(values: string[]): string[] {
    const seen = new Set<string>();

    return values.filter((value) => {
      const normalized = value.trim().toLowerCase();
      if (!normalized || seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
  }

  private asStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  }
}
