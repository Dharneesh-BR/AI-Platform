import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgentCapabilitySchema, type AgentTeamView, type BusinessAgentProfileView, type SanityKnowledgeSourceView } from './agent-runtime.types';

interface SanityWorkforceAgentDocument {
  _id?: string;
  name?: string;
  slug?: string;
  department?: string;
  description?: string;
  roleSummary?: string;
  avatarUrl?: string;
  avatarAlt?: string;
  icon?: string;
  displayOrder?: number;
  knowledgeSources?: SanityKnowledgeSourceDocument[];
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
  teamImageUrl?: string;
  teamImageAlt?: string;
  icon?: string;
  displayOrder?: number;
  supportedIntents?: string[];
  memberAgentSlugs?: string[];
  routingInstructions?: string;
  knowledgeSources?: SanityKnowledgeSourceDocument[];
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

interface SanityKnowledgeSourceDocument {
  _key?: string;
  title?: string;
  scope?: string;
  notes?: string;
  file?: {
    asset?: {
      _id?: string;
      url?: string;
      originalFilename?: string;
      mimeType?: string;
      size?: number;
    };
  };
}

const WORKFORCE_AGENTS_QUERY = /* groq */ `
  *[_type == "workforceAgent" && enabled == "enabled"] | order(department asc, name asc) {
    _id,
    name,
    "slug": slug.current,
    department,
    description,
    roleSummary,
    "avatarUrl": avatar.asset->url,
    "avatarAlt": avatar.alt,
    icon,
    displayOrder,
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
    knowledgeSources[] {
      _key,
      title,
      scope,
      notes,
      file {
        asset-> {
          _id,
          url,
          originalFilename,
          mimeType,
          size
        }
      }
    },
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
    "teamImageUrl": teamImage.asset->url,
    "teamImageAlt": teamImage.alt,
    icon,
    displayOrder,
    supportedIntents,
    "memberAgentSlugs": memberAgents[]->slug.current,
    routingInstructions,
    knowledgeSources[] {
      _key,
      title,
      scope,
      notes,
      file {
        asset-> {
          _id,
          url,
          originalFilename,
          mimeType,
          size
        }
      }
    },
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

  async listKnowledgeSources(): Promise<SanityKnowledgeSourceView[]> {
    const [agents, teams] = await Promise.all([
      this.fetchAgentDocuments(),
      this.fetchTeamDocuments(),
    ]);

    return [
      ...teams.flatMap((team) => this.toKnowledgeSources({
        ownerType: 'team',
        ownerSlug: team.teamSlug,
        sources: team.knowledgeSources,
      })),
      ...agents.flatMap((agent) => this.toKnowledgeSources({
        ownerType: 'agent',
        ownerSlug: agent.slug,
        sources: agent.knowledgeSources,
      })),
    ];
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

  private async fetchAgentDocuments(): Promise<SanityWorkforceAgentDocument[]> {
    const config = this.getConfig();
    if (!config) {
      return [];
    }

    try {
      const response = await fetch(this.buildQueryUrl(config, WORKFORCE_AGENTS_QUERY), {
        headers: config.token ? { Authorization: `Bearer ${config.token}` } : undefined,
      });

      if (!response.ok) {
        this.logger.warn(`Sanity workforce agent query failed with ${response.status} ${response.statusText}.`);
        return [];
      }

      const body = (await response.json()) as { result?: SanityWorkforceAgentDocument[] };
      return body.result ?? [];
    } catch (error) {
      this.logger.warn(`Sanity workforce agent query failed: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private async fetchTeamDocuments(): Promise<SanityAgentTeamDocument[]> {
    const config = this.getConfig();
    if (!config) {
      return [];
    }

    try {
      const response = await fetch(this.buildQueryUrl(config, AGENT_TEAMS_QUERY), {
        headers: config.token ? { Authorization: `Bearer ${config.token}` } : undefined,
      });

      if (!response.ok) {
        this.logger.warn(`Sanity agent team query failed with ${response.status} ${response.statusText}.`);
        return [];
      }

      const body = (await response.json()) as { result?: SanityAgentTeamDocument[] };
      return body.result ?? [];
    } catch (error) {
      this.logger.warn(`Sanity agent team query failed: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
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
      roleSummary: document.roleSummary ?? null,
      avatarUrl: document.avatarUrl ?? null,
      avatarAlt: document.avatarAlt ?? null,
      icon: document.icon ?? null,
      displayOrder: document.displayOrder ?? null,
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
      teamImageUrl: document.teamImageUrl ?? null,
      teamImageAlt: document.teamImageAlt ?? null,
      icon: document.icon ?? null,
      displayOrder: document.displayOrder ?? null,
      supportedIntents: this.parseStringArray(document.supportedIntents),
      memberAgentSlugs: this.parseStringArray(document.memberAgentSlugs),
      routingInstructions: document.routingInstructions ?? null,
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

  private toKnowledgeSources(input: {
    ownerType: 'team' | 'agent';
    ownerSlug?: string;
    sources?: SanityKnowledgeSourceDocument[];
  }): SanityKnowledgeSourceView[] {
    const ownerSlug = input.ownerSlug?.trim();
    if (!ownerSlug || !Array.isArray(input.sources)) {
      return [];
    }

    const knowledgeSources: SanityKnowledgeSourceView[] = [];

    input.sources.forEach((source, index) => {
      const asset = source.file?.asset;
      if (!source.title || !source.scope || !asset?.url) {
        return;
      }

      knowledgeSources.push({
        sourceId: `${input.ownerType}:${ownerSlug}:${source._key ?? asset._id ?? index}`,
        ownerType: input.ownerType,
        title: source.title,
        scope: source.scope,
        notes: source.notes ?? null,
        teamSlug: input.ownerType === 'team' ? ownerSlug : null,
        agentSlug: input.ownerType === 'agent' ? ownerSlug : null,
        fileUrl: asset.url,
        assetId: asset._id ?? null,
        originalFilename: asset.originalFilename ?? `${source.title}.txt`,
        mimeType: asset.mimeType ?? null,
        size: asset.size ?? null,
      });
    });

    return knowledgeSources;
  }
}
