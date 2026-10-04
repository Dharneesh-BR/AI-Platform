import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgentCapabilitySchema, type AgentTeamView, type BusinessAgentProfileView } from './agent-runtime.types';

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

interface SanityAgentTeamDocument {
  _id?: string;
  teamName?: string;
  teamSlug?: string;
  primaryAgentSlug?: string;
  department?: string;
  description?: string;
  supportedIntents?: string[];
  internalRoles?: Array<{
    roleName?: string;
    roleSlug?: string;
    roleType?: string;
    description?: string;
    instructions?: string;
    expectedOutput?: string;
    required?: boolean;
    runCondition?: string;
    order?: number;
  }>;
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

const AGENT_TEAMS_QUERY = /* groq */ `
  *[_type == "agentTeam" && enabled == "enabled"] | order(department asc, teamName asc) {
    _id,
    teamName,
    "teamSlug": teamSlug.current,
    "primaryAgentSlug": primaryAgent->slug.current,
    department,
    description,
    supportedIntents,
    internalRoles[] | order(order asc) {
      _key,
      roleName,
      "roleSlug": roleSlug.current,
      roleType,
      description,
      instructions,
      expectedOutput,
      required,
      runCondition,
      order
    },
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

  async listTeams(): Promise<AgentTeamView[]> {
    const config = this.getConfig();
    if (!config) {
      return [];
    }

    try {
      const url = this.buildQueryUrl(config, AGENT_TEAMS_QUERY);
      const response = await fetch(url, {
        headers: config.token ? { Authorization: `Bearer ${config.token}` } : undefined,
      });

      if (!response.ok) {
        this.logger.warn(`Sanity agent team query failed with ${response.status} ${response.statusText}.`);
        return [];
      }

      const body = (await response.json()) as { result?: SanityAgentTeamDocument[] };
      return (body.result ?? []).map((document) => this.toTeam(document)).filter((team): team is AgentTeamView => Boolean(team));
    } catch (error) {
      this.logger.warn(`Sanity agent team query failed: ${error instanceof Error ? error.message : String(error)}`);
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

  private toTeam(document: SanityAgentTeamDocument): AgentTeamView | null {
    if (!document.teamName || !document.teamSlug || !document.primaryAgentSlug || !document.department) {
      return null;
    }

    const internalRoles = Array.isArray(document.internalRoles)
      ? document.internalRoles
          .filter((role) => role.roleName && role.roleSlug && role.roleType && role.instructions && role.expectedOutput)
          .map((role, index) => ({
            roleName: role.roleName as string,
            roleSlug: role.roleSlug as string,
            roleType: role.roleType as string,
            description: role.description ?? null,
            instructions: role.instructions as string,
            expectedOutput: role.expectedOutput as string,
            required: role.required ?? true,
            runCondition: role.runCondition ?? null,
            order: typeof role.order === 'number' ? role.order : index + 1,
          }))
          .sort((left, right) => left.order - right.order)
      : [];

    if (!internalRoles.length) {
      return null;
    }

    return {
      id: document._id,
      source: 'sanity',
      teamName: document.teamName,
      teamSlug: document.teamSlug,
      primaryAgentSlug: document.primaryAgentSlug,
      department: document.department,
      description: document.description ?? null,
      supportedIntents: this.parseStringArray(document.supportedIntents),
      internalRoles,
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
