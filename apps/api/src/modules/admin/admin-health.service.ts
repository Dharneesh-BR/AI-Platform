import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from '../../common/queue/queue.constants';
import { QueueInfrastructureService } from '../../common/queue/queue-infrastructure.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisHealthService } from '../../common/redis/redis-health.service';

export interface AdminHealthResponse {
  status: 'healthy' | 'degraded' | 'unavailable';
  checkedAt: string;
  services: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'unavailable';
    detail: string;
  }>;
  counts: {
    users: number;
    projects: number;
    auditEvents: number;
  };
}

@Injectable()
export class AdminHealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly redisHealthService: RedisHealthService,
    private readonly queueInfrastructureService: QueueInfrastructureService,
  ) {}

  async getHealth(): Promise<AdminHealthResponse> {
    const services: AdminHealthResponse['services'] = [];

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      services.push({ name: 'PostgreSQL', status: 'healthy', detail: 'Database connection is available.' });
    } catch {
      services.push({ name: 'PostgreSQL', status: 'degraded', detail: 'Database connection failed.' });
    }

    services.push({
      name: 'Firebase Admin',
      status: this.hasFirebaseConfig ? 'healthy' : 'degraded',
      detail: this.hasFirebaseConfig ? 'Firebase Admin credentials are configured.' : 'Firebase Admin credentials are missing.',
    });

    services.push({
      name: 'LiteLLM',
      status: this.hasLiteLlmConfig ? 'healthy' : 'degraded',
      detail: this.hasLiteLlmConfig ? 'LiteLLM gateway is configured.' : 'LiteLLM gateway credentials are missing.',
    });

    services.push({
      name: 'Model policy aliases',
      status: this.modelPolicyReadiness.every((policy) => policy.configured) ? 'healthy' : 'degraded',
      detail: this.modelPolicyReadiness
        .map((policy) => `${policy.name}: ${policy.configured ? 'configured' : 'missing'}`)
        .join(', '),
    });

    const redisHealth = await this.redisHealthService.check();
    services.push({
      name: 'Redis',
      status: redisHealth.status,
      detail: redisHealth.detail,
    });

    const discoveryQueueStatus = await this.queueInfrastructureService.checkQueue(QUEUE_NAMES.discovery);
    services.push({
      name: 'BullMQ discovery queue',
      status: discoveryQueueStatus,
      detail:
        discoveryQueueStatus === 'healthy'
          ? 'Discovery queue connectivity is available.'
          : 'Discovery queue connectivity is unavailable or degraded.',
    });

    const documentQueueStatus = await this.queueInfrastructureService.checkQueue(QUEUE_NAMES.documentProcessing);
    services.push({
      name: 'BullMQ document-processing queue',
      status: documentQueueStatus,
      detail:
        documentQueueStatus === 'healthy'
          ? 'Document-processing queue connectivity is available.'
          : 'Document-processing queue connectivity is unavailable or degraded.',
    });

    const aiExecutionQueueStatus = await this.queueInfrastructureService.checkQueue(QUEUE_NAMES.aiExecution);
    services.push({
      name: 'BullMQ ai-execution queue',
      status: aiExecutionQueueStatus,
      detail:
        aiExecutionQueueStatus === 'healthy'
          ? 'AI execution queue connectivity is available for future async agent runs.'
          : 'AI execution queue connectivity is unavailable or degraded.',
    });

    try {
      const extension = await this.prisma.$queryRaw<Array<{ installed: boolean }>>`
        SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') AS installed
      `;
      services.push({
        name: 'pgvector',
        status: extension[0]?.installed ? 'healthy' : 'degraded',
        detail: extension[0]?.installed ? 'pgvector extension is installed.' : 'pgvector extension is not installed.',
      });
    } catch {
      services.push({ name: 'pgvector', status: 'unavailable', detail: 'Unable to verify pgvector extension.' });
    }

    services.push({
      name: 'Embeddings',
      status: this.configService.get<string>('EMBEDDING_PROVIDER') === 'litellm'
        ? this.hasEmbeddingConfig ? 'healthy' : 'degraded'
        : 'healthy',
      detail: this.configService.get<string>('EMBEDDING_PROVIDER') === 'litellm'
        ? this.hasEmbeddingConfig
          ? 'LiteLLM embedding provider is configured.'
          : 'LiteLLM embedding provider requires EMBEDDING_MODEL.'
        : 'Local deterministic embedding provider is active for development.',
    });

    try {
      const [pendingDocuments, failedDocuments] = await Promise.all([
        this.prisma.knowledgeDocument.count({
          where: { status: { in: ['UPLOADED', 'QUEUED', 'PROCESSING'] }, deletedAt: null },
        }),
        this.prisma.knowledgeDocument.count({
          where: { status: 'FAILED', deletedAt: null },
        }),
      ]);
      services.push({
        name: 'Knowledge document jobs',
        status: failedDocuments > 0 ? 'degraded' : 'healthy',
        detail: `${pendingDocuments} pending/processing, ${failedDocuments} failed.`,
      });
    } catch {
      services.push({
        name: 'Knowledge document jobs',
        status: 'degraded',
        detail: 'Knowledge document job counts are unavailable until schema migration is applied.',
      });
    }

    try {
      const enabledAgentProfiles = await this.prisma.businessAgentProfile.count({
        where: { enabled: true, deletedAt: null },
      });
      services.push({
        name: 'Agent runtime profiles',
        status: enabledAgentProfiles > 0 ? 'healthy' : 'degraded',
        detail: `${enabledAgentProfiles} enabled business agent profiles are available.`,
      });
    } catch {
      services.push({
        name: 'Agent runtime profiles',
        status: 'degraded',
        detail: 'Business agent profile counts are unavailable until schema migration is applied.',
      });
    }

    const [users, projects, auditEvents] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.project.count({ where: { deletedAt: null } }),
      this.prisma.auditLog.count({ where: { deletedAt: null } }),
    ]);

    return {
      status: services.some((service) => service.status === 'unavailable')
        ? 'unavailable'
        : services.every((service) => service.status === 'healthy')
          ? 'healthy'
          : 'degraded',
      checkedAt: new Date().toISOString(),
      services,
      counts: {
        users,
        projects,
        auditEvents,
      },
    };
  }

  private get hasFirebaseConfig(): boolean {
    return Boolean(
      this.configService.get<string>('FIREBASE_PROJECT_ID') &&
        this.configService.get<string>('FIREBASE_CLIENT_EMAIL') &&
        this.configService.get<string>('FIREBASE_PRIVATE_KEY'),
    );
  }

  private get hasLiteLlmConfig(): boolean {
    return Boolean(
      this.configService.get<string>('LITELLM_BASE_URL') &&
        this.configService.get<string>('LITELLM_API_KEY'),
    );
  }

  private get hasEmbeddingConfig(): boolean {
    return Boolean(
      this.hasLiteLlmConfig &&
        this.configService.get<string>('EMBEDDING_MODEL') &&
        this.configService.get<string>('EMBEDDING_DIMENSIONS'),
    );
  }

  private get modelPolicyReadiness() {
    return ['DEFAULT', 'REASONING', 'RESEARCH', 'WRITING', 'VERIFICATION'].map((policy) => ({
      name: policy.toLowerCase(),
      configured: Boolean(
        this.configService.get<string>(`MODEL_${policy}`)?.trim() ||
          (policy === 'DEFAULT' ? this.configService.get<string>('LITELLM_DEFAULT_MODEL')?.trim() : undefined) ||
          this.configService.get<string>(`MODEL_POLICY_${policy}`)?.trim(),
      ),
    }));
  }
}
