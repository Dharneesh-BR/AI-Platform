import {
  DiscoveryStatus,
  MembershipStatus,
  PlatformRole,
  PrismaClient,
  ProjectLifecycleState,
  ProjectStatus,
  ResearchSourceType,
} from '@prisma/client';

const prisma = new PrismaClient();

const ids = {
  organization: '11111111-1111-4111-8111-111111111111',
  project: '22222222-2222-4222-8222-222222222222',
  superAdmin: '33333333-3333-4333-8333-333333333331',
  orgAdmin: '33333333-3333-4333-8333-333333333332',
  consultant: '33333333-3333-4333-8333-333333333333',
  viewer: '33333333-3333-4333-8333-333333333334',
  projectProfile: '44444444-4444-4444-8444-444444444444',
  discoveryJob: '55555555-5555-4555-8555-555555555555',
  companyProfile: '66666666-6666-4666-8666-666666666666',
  technology1: '77777777-7777-4777-8777-777777777771',
  technology2: '77777777-7777-4777-8777-777777777772',
  competitor1: '88888888-8888-4888-8888-888888888881',
  competitor2: '88888888-8888-4888-8888-888888888882',
  goal1: '99999999-9999-4999-8999-999999999991',
  goal2: '99999999-9999-4999-8999-999999999992',
  source1: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  source2: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  modelProvider: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  modelConfig: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  promptTemplate: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  promptVersion: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  billingAccount: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
  report: '12121212-1212-4212-8212-121212121212',
  reportSection1: '13131313-1313-4313-8313-131313131313',
  reportSection2: '14141414-1414-4414-8414-141414141414',
};

const users = [
  {
    id: ids.superAdmin,
    firebaseUid: 'demo-super-admin',
    email: 'super.admin@magnafic.ai',
    displayName: 'Super Admin',
    role: PlatformRole.SUPER_ADMIN,
  },
  {
    id: ids.orgAdmin,
    firebaseUid: 'demo-org-admin',
    email: 'org.admin@client.com',
    displayName: 'Organization Admin',
    role: PlatformRole.ADMIN,
  },
  {
    id: ids.consultant,
    firebaseUid: 'demo-consultant',
    email: 'consultant@magnafic.ai',
    displayName: 'Consultant',
    role: PlatformRole.CONSULTANT,
  },
  {
    id: ids.viewer,
    firebaseUid: 'demo-viewer',
    email: 'viewer@client.com',
    displayName: 'Viewer',
    role: PlatformRole.VIEWER,
  },
];

async function seedUsers() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { firebaseUid: user.firebaseUid },
      create: user,
      update: {
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        deletedAt: null,
      },
    });
  }
}

async function seedOrganization() {
  await prisma.organization.upsert({
    where: { slug: 'magnafic-ai' },
    create: {
      id: ids.organization,
      name: 'Magnafic AI',
      slug: 'magnafic-ai',
      description: 'Demo client workspace for the stakeholder walkthrough.',
      settings: {
        demo: true,
        defaultProjectId: ids.project,
        approvedDomains: ['magnafic.ai'],
      },
      createdBy: ids.superAdmin,
      updatedBy: ids.superAdmin,
    },
    update: {
      name: 'Magnafic AI',
      description: 'Demo client workspace for the stakeholder walkthrough.',
      deletedAt: null,
      updatedBy: ids.superAdmin,
    },
  });
}

async function seedMemberships() {
  for (const user of users) {
    await prisma.organizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: ids.organization,
          userId: user.id,
        },
      },
      create: {
        organizationId: ids.organization,
        userId: user.id,
        role: user.role,
        status: MembershipStatus.ACTIVE,
        invitedAt: new Date('2026-08-01T09:00:00.000Z'),
        joinedAt: new Date('2026-08-01T09:10:00.000Z'),
        createdBy: ids.superAdmin,
        updatedBy: ids.superAdmin,
      },
      update: {
        role: user.role,
        status: MembershipStatus.ACTIVE,
        deletedAt: null,
        updatedBy: ids.superAdmin,
      },
    });
  }
}

async function seedProject() {
  await prisma.project.upsert({
    where: {
      organizationId_slug: {
        organizationId: ids.organization,
        slug: 'magnafic-ai-strategy',
      },
    },
    create: {
      id: ids.project,
      organizationId: ids.organization,
      name: 'Magnafic AI Strategy',
      slug: 'magnafic-ai-strategy',
      description: 'AI consulting strategy workspace used for the stakeholder demo.',
      status: ProjectStatus.ACTIVE,
      lifecycleState: ProjectLifecycleState.AI_READY,
      metadata: {
        demo: true,
        nextRoute: '/projects/22222222-2222-4222-8222-222222222222',
      },
      createdBy: ids.consultant,
      updatedBy: ids.consultant,
    },
    update: {
      name: 'Magnafic AI Strategy',
      description: 'AI consulting strategy workspace used for the stakeholder demo.',
      status: ProjectStatus.ACTIVE,
      lifecycleState: ProjectLifecycleState.AI_READY,
      deletedAt: null,
      updatedBy: ids.consultant,
    },
  });
}

async function seedProjectProfile() {
  await prisma.projectProfile.upsert({
    where: { projectId: ids.project },
    create: {
      id: ids.projectProfile,
      tenantId: ids.organization,
      organizationId: ids.organization,
      projectId: ids.project,
      companyName: 'Magnafic AI',
      websiteUrl: 'https://magnafic.ai',
      industry: 'AI consulting and transformation',
      companySize: '11-50',
      businessModel: 'B2B consulting and platform-enabled delivery',
      targetMarket: 'Mid-market and enterprise teams adopting AI workflows',
      businessGoals: [
        'Create a repeatable AI consulting delivery workflow',
        'Reduce manual discovery effort',
        'Generate stakeholder-ready strategy outputs',
      ],
      primaryChallenges: [
        'Context scattered across websites, documents, and calls',
        'Generic AI outputs that do not reflect the client company',
        'Need for human approval and governance',
      ],
      competitors: ['Traditional consulting firms', 'Generic AI chatbot tools'],
      documents: ['Stakeholder pre-read deck', 'Project onboarding brief'],
      brandGuidelines: ['Professional', 'Clear', 'Trustworthy', 'Executive-ready'],
      strategyDocuments: ['AI readiness roadmap', 'Discovery summary'],
      onboardingStep: 'completed',
      completedAt: new Date('2026-08-14T10:00:00.000Z'),
      createdBy: ids.consultant,
      updatedBy: ids.consultant,
    },
    update: {
      companyName: 'Magnafic AI',
      websiteUrl: 'https://magnafic.ai',
      onboardingStep: 'completed',
      completedAt: new Date('2026-08-14T10:00:00.000Z'),
      deletedAt: null,
      updatedBy: ids.consultant,
    },
  });
}

async function seedDiscovery() {
  await prisma.discoveryJob.upsert({
    where: {
      projectId_idempotencyKey: {
        projectId: ids.project,
        idempotencyKey: 'demo-discovery-completed',
      },
    },
    create: {
      id: ids.discoveryJob,
      tenantId: ids.organization,
      organizationId: ids.organization,
      projectId: ids.project,
      status: DiscoveryStatus.COMPLETED,
      idempotencyKey: 'demo-discovery-completed',
      progress: 100,
      currentStep: 'completed',
      steps: [
        { key: 'validate_website', status: 'SUCCEEDED' },
        { key: 'extract_metadata', status: 'SUCCEEDED' },
        { key: 'generate_profile', status: 'SUCCEEDED' },
      ],
      attempts: 1,
      startedAt: new Date('2026-08-14T10:05:00.000Z'),
      completedAt: new Date('2026-08-14T10:07:00.000Z'),
      createdBy: ids.consultant,
      updatedBy: ids.consultant,
    },
    update: {
      status: DiscoveryStatus.COMPLETED,
      progress: 100,
      currentStep: 'completed',
      deletedAt: null,
      updatedBy: ids.consultant,
    },
  });
}

async function seedCompanyProfile() {
  await prisma.companyProfile.upsert({
    where: {
      projectId_version: {
        projectId: ids.project,
        version: 1,
      },
    },
    create: {
      id: ids.companyProfile,
      tenantId: ids.organization,
      organizationId: ids.organization,
      projectId: ids.project,
      version: 1,
      isApproved: true,
      approvedAt: new Date('2026-08-14T10:15:00.000Z'),
      mission: 'Help organizations adopt AI through governed consulting workflows.',
      vision: 'Become the operating system for AI consulting delivery.',
      industry: 'AI consulting and transformation',
      targetCustomers: ['Enterprise leadership teams', 'Innovation teams', 'Consulting delivery teams'],
      products: ['AI strategy workspace', 'Company discovery engine', 'Knowledge-aware AI assistant'],
      services: ['AI readiness assessment', 'Workflow automation planning', 'Executive report generation'],
      painPoints: ['Manual discovery', 'Low-trust AI answers', 'Slow report production'],
      uniqueSellingProposition: 'Combines project onboarding, company discovery, human approval, and AI outputs in one governed flow.',
      summaries: {
        executive: 'Magnafic AI is positioned as a project-first AI consulting platform.',
        demo: 'Profile approved and ready for knowledge, research, chat, and report workflows.',
      },
      sourceMetadata: {
        confidence: 0.91,
        source: 'seed-data',
      },
      createdBy: ids.consultant,
      updatedBy: ids.consultant,
    },
    update: {
      isApproved: true,
      approvedAt: new Date('2026-08-14T10:15:00.000Z'),
      deletedAt: null,
      updatedBy: ids.consultant,
    },
  });
}

async function seedCompanySignals() {
  await prisma.companyTechnology.upsert({
    where: { id: ids.technology1 },
    create: {
      id: ids.technology1,
      tenantId: ids.organization,
      organizationId: ids.organization,
      projectId: ids.project,
      companyProfileId: ids.companyProfile,
      name: 'Next.js',
      category: 'Frontend',
      confidence: '0.8700',
      evidence: ['Frontend app is implemented with Next.js app router.'],
    },
    update: { deletedAt: null },
  });

  await prisma.companyTechnology.upsert({
    where: { id: ids.technology2 },
    create: {
      id: ids.technology2,
      tenantId: ids.organization,
      organizationId: ids.organization,
      projectId: ids.project,
      companyProfileId: ids.companyProfile,
      name: 'NestJS',
      category: 'Backend',
      confidence: '0.8500',
      evidence: ['API app is implemented with modular NestJS modules.'],
    },
    update: { deletedAt: null },
  });

  await prisma.companyCompetitor.upsert({
    where: { id: ids.competitor1 },
    create: {
      id: ids.competitor1,
      tenantId: ids.organization,
      organizationId: ids.organization,
      projectId: ids.project,
      companyProfileId: ids.companyProfile,
      name: 'Generic AI assistant platforms',
      positioning: 'Broad AI tools without consulting lifecycle governance.',
      strengths: ['Fast adoption', 'Broad feature familiarity'],
      weaknesses: ['Weak project context', 'Limited approval workflow'],
      confidence: '0.7800',
    },
    update: { deletedAt: null },
  });

  await prisma.companyCompetitor.upsert({
    where: { id: ids.competitor2 },
    create: {
      id: ids.competitor2,
      tenantId: ids.organization,
      organizationId: ids.organization,
      projectId: ids.project,
      companyProfileId: ids.companyProfile,
      name: 'Traditional consulting delivery',
      positioning: 'High-touch advisory with slower manual research cycles.',
      strengths: ['Strong client trust', 'Deep domain expertise'],
      weaknesses: ['Manual repeat work', 'Harder to scale knowledge reuse'],
      confidence: '0.7400',
    },
    update: { deletedAt: null },
  });

  await prisma.companyGoal.upsert({
    where: { id: ids.goal1 },
    create: {
      id: ids.goal1,
      tenantId: ids.organization,
      organizationId: ids.organization,
      projectId: ids.project,
      companyProfileId: ids.companyProfile,
      title: 'Launch stakeholder-ready AI consulting demo',
      description: 'Show end-to-end flow from login to AI-ready outputs.',
      priority: 1,
    },
    update: { deletedAt: null },
  });

  await prisma.companyGoal.upsert({
    where: { id: ids.goal2 },
    create: {
      id: ids.goal2,
      tenantId: ids.organization,
      organizationId: ids.organization,
      projectId: ids.project,
      companyProfileId: ids.companyProfile,
      title: 'Convert demo into live MVP',
      description: 'Wire live auth, persistence, discovery, knowledge ingestion, and AI orchestration.',
      priority: 2,
    },
    update: { deletedAt: null },
  });
}

async function seedKnowledgeAndReports() {
  await prisma.researchSource.upsert({
    where: { id: ids.source1 },
    create: {
      id: ids.source1,
      tenantId: ids.organization,
      organizationId: ids.organization,
      projectId: ids.project,
      type: ResearchSourceType.PROJECT_PROFILE,
      sourceId: ids.projectProfile,
      title: 'Project onboarding profile',
      content: {
        summary: 'Onboarding captured business goals, challenges, target market, and desired AI outcomes.',
      },
      metadata: { confidence: 1, demo: true },
      createdBy: ids.consultant,
      updatedBy: ids.consultant,
    },
    update: { deletedAt: null, updatedBy: ids.consultant },
  });

  await prisma.researchSource.upsert({
    where: { id: ids.source2 },
    create: {
      id: ids.source2,
      tenantId: ids.organization,
      organizationId: ids.organization,
      projectId: ids.project,
      type: ResearchSourceType.COMPANY_PROFILE,
      sourceId: ids.companyProfile,
      title: 'Approved company profile',
      content: {
        summary: 'Approved profile describes Magnafic AI positioning, customers, services, and differentiators.',
      },
      metadata: { confidence: 0.91, demo: true },
      createdBy: ids.consultant,
      updatedBy: ids.consultant,
    },
    update: { deletedAt: null, updatedBy: ids.consultant },
  });

  await prisma.report.upsert({
    where: { id: ids.report },
    create: {
      id: ids.report,
      organizationId: ids.organization,
      projectId: ids.project,
      title: 'AI Readiness Stakeholder Summary',
      status: 'READY',
      metadata: { demo: true, audience: 'stakeholders' },
      createdBy: ids.consultant,
      updatedBy: ids.consultant,
    },
    update: {
      title: 'AI Readiness Stakeholder Summary',
      status: 'READY',
      deletedAt: null,
      updatedBy: ids.consultant,
    },
  });

  await prisma.reportSection.upsert({
    where: {
      reportId_ordinal: {
        reportId: ids.report,
        ordinal: 1,
      },
    },
    create: {
      id: ids.reportSection1,
      reportId: ids.report,
      title: 'Executive Summary',
      kind: 'narrative',
      ordinal: 1,
      content: {
        text: 'Magnafic AI is ready to demonstrate a governed project-first AI consulting workflow.',
      },
      createdBy: ids.consultant,
      updatedBy: ids.consultant,
    },
    update: { deletedAt: null, updatedBy: ids.consultant },
  });

  await prisma.reportSection.upsert({
    where: {
      reportId_ordinal: {
        reportId: ids.report,
        ordinal: 2,
      },
    },
    create: {
      id: ids.reportSection2,
      reportId: ids.report,
      title: 'Recommended Next Milestones',
      kind: 'roadmap',
      ordinal: 2,
      content: {
        milestones: ['Live auth/session', 'Database migrations and seed', 'Real discovery', 'Knowledge ingestion', 'AI orchestration'],
      },
      createdBy: ids.consultant,
      updatedBy: ids.consultant,
    },
    update: { deletedAt: null, updatedBy: ids.consultant },
  });
}

async function seedModelAndPromptDefaults() {
  await prisma.modelProvider.upsert({
    where: { name: 'LiteLLM Gateway' },
    create: {
      id: ids.modelProvider,
      name: 'LiteLLM Gateway',
      baseUrl: 'http://localhost:4000',
      enabled: false,
      metadata: { demo: true, note: 'Enable when LiteLLM is configured.' },
    },
    update: {
      baseUrl: 'http://localhost:4000',
      deletedAt: null,
    },
  });

  await prisma.modelConfiguration.upsert({
    where: {
      providerId_modelKey: {
        providerId: ids.modelProvider,
        modelKey: 'gpt-4.1-mini',
      },
    },
    create: {
      id: ids.modelConfig,
      providerId: ids.modelProvider,
      modelKey: 'gpt-4.1-mini',
      displayName: 'GPT-4.1 Mini via LiteLLM',
      enabled: false,
      capabilities: ['chat', 'research', 'summarization'],
      routingPriority: 100,
    },
    update: {
      displayName: 'GPT-4.1 Mini via LiteLLM',
      deletedAt: null,
    },
  });

  await prisma.promptTemplate.upsert({
    where: {
      name_category: {
        name: 'Company-aware research brief',
        category: 'research',
      },
    },
    create: {
      id: ids.promptTemplate,
      name: 'Company-aware research brief',
      description: 'Generates a research brief using approved company and project context.',
      category: 'research',
      status: 'APPROVED',
      versions: {
        create: {
          id: ids.promptVersion,
          version: 1,
          content: 'Use the approved company profile and project goals to produce a concise stakeholder-ready research brief.',
          variables: ['companyProfile', 'projectGoals', 'researchQuestion'],
          metadata: { demo: true },
        },
      },
    },
    update: {
      description: 'Generates a research brief using approved company and project context.',
      status: 'APPROVED',
      deletedAt: null,
    },
  });
}

async function seedBilling() {
  await prisma.billingAccount.upsert({
    where: { organizationId: ids.organization },
    create: {
      id: ids.billingAccount,
      organizationId: ids.organization,
      planKey: 'demo',
      status: 'active',
      metadata: {
        seats: 4,
        monthlyCredits: 100000,
      },
      createdBy: ids.superAdmin,
      updatedBy: ids.superAdmin,
    },
    update: {
      planKey: 'demo',
      status: 'active',
      deletedAt: null,
      updatedBy: ids.superAdmin,
    },
  });
}

async function main() {
  await seedUsers();
  await seedOrganization();
  await seedMemberships();
  await seedProject();
  await seedProjectProfile();
  await seedDiscovery();
  await seedCompanyProfile();
  await seedCompanySignals();
  await seedKnowledgeAndReports();
  await seedModelAndPromptDefaults();
  await seedBilling();

  console.info('Seed complete:', {
    organizationId: ids.organization,
    projectId: ids.project,
    users: users.map((user) => user.email),
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
