import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard, RolesGuard, TenantContextGuard } from './common/auth';
import { PrismaModule } from './common/prisma/prisma.module';
import { AdminModule } from './modules/admin/admin.module';
import { AgentsModule } from './modules/agents/agents.module';
import { AiModule } from './modules/ai/ai.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { CompanyDiscoveryModule } from './modules/company-discovery/company-discovery.module';
import { CompanyProfileModule } from './modules/company-profile/company-profile.module';
import { DiscoveryJobsModule } from './modules/discovery-jobs/discovery-jobs.module';
import { KnowledgeBaseModule } from './modules/knowledge-base/knowledge-base.module';
import { ModelManagementModule } from './modules/model-management/model-management.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ProjectProfileModule } from './modules/project-profile/project-profile.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { PromptLibraryModule } from './modules/prompt-library/prompt-library.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ResearchModule } from './modules/research/research.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '../../.env'],
      isGlobal: true,
    }),
    PrismaModule,
    AdminModule,
    AgentsModule,
    AiModule,
    AuditLogsModule,
    AuthModule,
    BillingModule,
    CompanyDiscoveryModule,
    CompanyProfileModule,
    ConversationsModule,
    DiscoveryJobsModule,
    KnowledgeBaseModule,
    ModelManagementModule,
    NotificationsModule,
    OnboardingModule,
    OrganizationsModule,
    ProjectProfileModule,
    ProjectsModule,
    PromptLibraryModule,
    ReportsModule,
    ResearchModule,
    UsersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantContextGuard,
    },
  ],
})
export class AppModule {}
