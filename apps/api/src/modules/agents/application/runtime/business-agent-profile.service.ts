import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { AgentCapabilitySchema, type BusinessAgentProfileView } from './agent-runtime.types';
import { SanityAgentProfileClient } from './sanity-agent-profile.client';

const DEFAULT_AGENT_SLUG = 'magnafic-ai';
const DEFAULT_AGENT_ALLOWED_TOOLS = [
  'vector_search',
  'company_profile',
  'readiness_report',
  'document_lookup',
];
const DEFAULT_AGENT_PROFILE: BusinessAgentProfileView = {
  source: 'database',
  name: 'Magnafic AI',
  slug: DEFAULT_AGENT_SLUG,
  department: 'Strategy',
  description: 'General AI strategy consultant for project onboarding, knowledge, research, and reporting.',
  systemInstructions:
    'You are Magnafic AI, a pragmatic executive AI consultant. Use project context, company profile data, reports, and knowledge sources to produce specific recommendations. If context is incomplete, state the assumption and continue with a useful first-pass answer instead of asking the user to upload more data.',
  capabilities: ['rag', 'analysis', 'writing', 'planning'],
  allowedSpecialists: ['rag', 'analysis', 'writing', 'research'],
  allowedTools: DEFAULT_AGENT_ALLOWED_TOOLS,
  knowledgeScopes: ['GENERAL', 'COMPANY_PROFILE'],
  modelPolicy: {},
  verificationPolicy: {},
  enabled: true,
};

@Injectable()
export class BusinessAgentProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sanityAgentProfileClient: SanityAgentProfileClient,
  ) {}

  async list(): Promise<BusinessAgentProfileView[]> {
    const sanityProfiles = await this.sanityAgentProfileClient.list();
    const profiles = await this.prisma.businessAgentProfile.findMany({
      where: {
        deletedAt: null,
        enabled: true,
      },
      orderBy: [{ department: 'asc' }, { name: 'asc' }],
    }).catch(() => []);

    const mergedProfiles = this.mergeProfiles(sanityProfiles, profiles.map((profile) => this.toView(profile)));
    return mergedProfiles.length ? mergedProfiles : [DEFAULT_AGENT_PROFILE];
  }

  async getBySlug(slug?: string): Promise<BusinessAgentProfileView> {
    const normalizedSlug = slug?.trim() || DEFAULT_AGENT_SLUG;
    const sanityProfile = (await this.sanityAgentProfileClient.list()).find((profile) => profile.slug === normalizedSlug);
    if (sanityProfile) {
      return sanityProfile;
    }

    const profile = await this.prisma.businessAgentProfile.findFirst({
      where: {
        slug: normalizedSlug,
        deletedAt: null,
        enabled: true,
      },
    }).catch(() => null);

    if (!profile) {
      if (normalizedSlug === DEFAULT_AGENT_SLUG) {
        return DEFAULT_AGENT_PROFILE;
      }

      throw new NotFoundException(`Business agent '${normalizedSlug}' is not available.`);
    }

    return this.toView(profile);
  }

  private toView(profile: {
    id: string;
    name: string;
    slug: string;
    department: string;
    description: string | null;
    systemInstructions: string;
    capabilities: unknown;
    allowedSpecialists: unknown;
    allowedTools: unknown;
    knowledgeScopes: unknown;
    modelPolicy: unknown;
    verificationPolicy: unknown;
    enabled: boolean;
  }): BusinessAgentProfileView {
    return {
      id: profile.id,
      source: 'database',
      name: profile.name,
      slug: profile.slug,
      department: profile.department,
      description: profile.description,
      systemInstructions: profile.systemInstructions,
      capabilities: this.parseCapabilities(profile.capabilities),
      allowedSpecialists: this.parseStringArray(profile.allowedSpecialists),
      allowedTools: this.allowedToolsFor(profile.slug, profile.allowedTools),
      knowledgeScopes: this.parseStringArray(profile.knowledgeScopes),
      modelPolicy: this.parseRecord(profile.modelPolicy),
      verificationPolicy: this.parseRecord(profile.verificationPolicy),
      enabled: profile.enabled,
    };
  }

  private mergeProfiles(sanityProfiles: BusinessAgentProfileView[], databaseProfiles: BusinessAgentProfileView[]): BusinessAgentProfileView[] {
    const profilesBySlug = new Map<string, BusinessAgentProfileView>();

    for (const profile of databaseProfiles) {
      profilesBySlug.set(profile.slug, profile);
    }
    for (const profile of sanityProfiles) {
      profilesBySlug.set(profile.slug, profile);
    }

    return [...profilesBySlug.values()].sort((first, second) =>
      `${first.department}:${first.name}`.localeCompare(`${second.department}:${second.name}`),
    );
  }

  private parseCapabilities(value: unknown) {
    return this.parseStringArray(value).filter((capability) => AgentCapabilitySchema.safeParse(capability).success) as BusinessAgentProfileView['capabilities'];
  }

  private parseStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  }

  private allowedToolsFor(slug: string, value: unknown): string[] {
    const configuredTools = this.parseStringArray(value);

    if (slug !== DEFAULT_AGENT_SLUG) {
      return configuredTools;
    }

    return [...new Set([...configuredTools, ...DEFAULT_AGENT_ALLOWED_TOOLS])];
  }

  private parseRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }
}
