import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgentCapabilitySchema, type BusinessAgentProfileView } from './agent-runtime.types';

interface SanityWorkforceAgentDocument {
  _id?: string;
  name?: string;
  slug?: string;
  department?: string;
  description?: string;
  systemInstructions?: string;
  responseFormatInstructions?: string;
  outputSections?: Array<{
    heading?: string;
    instructions?: string;
    required?: boolean;
  }>;
  capabilities?: string[];
  allowedSpecialists?: string[];
  allowedTools?: string[];
  knowledgeScopes?: string[];
  modelPolicy?: Record<string, unknown>;
  verificationPolicy?: Record<string, unknown>;
  enabled?: boolean;
}

const WORKFORCE_AGENTS_QUERY = /* groq */ `
  *[_type == "workforceAgent" && enabled == "enabled"] | order(department asc, name asc) {
    _id,
    name,
    "slug": slug.current,
    department,
    description,
    systemInstructions,
    responseFormatInstructions,
    outputSections[] {
      _key,
      heading,
      instructions,
      required
    },
    capabilities,
    allowedSpecialists,
    allowedTools,
    knowledgeScopes,
    modelPolicy,
    verificationPolicy,
    "enabled": enabled == "enabled"
  }
`;

@Injectable()
export class SanityAgentProfileClient {
  private readonly logger = new Logger(SanityAgentProfileClient.name);

  constructor(private readonly configService: ConfigService) {}

  async list(): Promise<BusinessAgentProfileView[]> {
    const config = this.getConfig();
    if (!config) {
      return [];
    }

    try {
      const url = this.buildQueryUrl(config, WORKFORCE_AGENTS_QUERY);
      const response = await fetch(url, {
        headers: config.token ? { Authorization: `Bearer ${config.token}` } : undefined,
      });

      if (!response.ok) {
        this.logger.warn(`Sanity workforce agent query failed with ${response.status} ${response.statusText}.`);
        return [];
      }

      const body = (await response.json()) as { result?: SanityWorkforceAgentDocument[] };
      return (body.result ?? []).map((document) => this.toProfile(document)).filter((profile): profile is BusinessAgentProfileView => Boolean(profile));
    } catch (error) {
      this.logger.warn(`Sanity workforce agent query failed: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private getConfig() {
    const projectId = this.configService.get<string>('SANITY_PROJECT_ID')?.trim();
    const dataset = this.configService.get<string>('SANITY_DATASET')?.trim() || 'production';
    const token = this.configService.get<string>('SANITY_API_TOKEN')?.trim();
    const apiVersion = this.configService.get<string>('SANITY_API_VERSION')?.trim() || '2026-09-19';

    if (!projectId) {
      return null;
    }

    return { projectId, dataset, token, apiVersion };
  }

  private buildQueryUrl(config: { projectId: string; dataset: string; apiVersion: string }, query: string): string {
    const params = new URLSearchParams({ query });
    return `https://${config.projectId}.api.sanity.io/v${config.apiVersion}/data/query/${config.dataset}?${params.toString()}`;
  }

  private toProfile(document: SanityWorkforceAgentDocument): BusinessAgentProfileView | null {
    if (!document.name || !document.slug || !document.department || !document.systemInstructions) {
      return null;
    }

    return {
      id: undefined,
      organizationId: null,
      source: 'sanity',
      name: document.name,
      slug: document.slug,
      department: document.department,
      description: document.description ?? null,
      systemInstructions: document.systemInstructions,
      responseFormatInstructions: document.responseFormatInstructions ?? null,
      outputSections: this.parseOutputSections(document.outputSections),
      capabilities: this.parseCapabilities(document.capabilities),
      allowedSpecialists: this.parseStringArray(document.allowedSpecialists),
      allowedTools: this.parseStringArray(document.allowedTools),
      knowledgeScopes: this.parseStringArray(document.knowledgeScopes),
      modelPolicy: this.parseRecord(document.modelPolicy),
      verificationPolicy: this.parseRecord(document.verificationPolicy),
      enabled: document.enabled ?? true,
    };
  }

  private parseOutputSections(value: SanityWorkforceAgentDocument['outputSections']) {
    return Array.isArray(value)
      ? value
          .filter((section) => typeof section.heading === 'string' && typeof section.instructions === 'string')
          .map((section) => ({
            heading: section.heading as string,
            instructions: section.instructions as string,
            required: section.required ?? true,
          }))
      : [];
  }

  private parseCapabilities(value: unknown) {
    return this.parseStringArray(value).filter((capability) => AgentCapabilitySchema.safeParse(capability).success) as BusinessAgentProfileView['capabilities'];
  }

  private parseStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  }

  private parseRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }
}
