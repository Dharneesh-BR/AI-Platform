import { Module } from '@nestjs/common';
import { DiscoveryJobsModule } from '../discovery-jobs/discovery-jobs.module';
import { BullMqDiscoveryWorker } from '../discovery-jobs/infrastructure/queues/bullmq-discovery.worker';
import { WebsiteAnalysisModule } from '../website-analysis/website-analysis.module';
import { DISCOVERY_OUTPUT_REPOSITORY } from './application/ports/discovery-output.repository';
import { CompanyProfileGenerationService } from './application/services/company-profile-generation.service';
import { ContentExtractionService } from './application/services/content-extraction.service';
import { DiscoveryOrchestratorService } from './application/services/discovery-orchestrator.service';
import { DiscoveryWorkerProcessorService } from './application/services/discovery-worker-processor.service';
import { MetadataExtractionService } from './application/services/metadata-extraction.service';
import { NavigationExtractionService } from './application/services/navigation-extraction.service';
import { ProductServiceExtractionService } from './application/services/product-service-extraction.service';
import { TechnologyDetectionService } from './application/services/technology-detection.service';
import { WebsiteValidationService } from './application/services/website-validation.service';
import { PrismaDiscoveryOutputRepository } from './infrastructure/prisma/prisma-discovery-output.repository';

@Module({
  imports: [DiscoveryJobsModule, WebsiteAnalysisModule],
  providers: [
    CompanyProfileGenerationService,
    ContentExtractionService,
    BullMqDiscoveryWorker,
    DiscoveryOrchestratorService,
    DiscoveryWorkerProcessorService,
    MetadataExtractionService,
    NavigationExtractionService,
    ProductServiceExtractionService,
    TechnologyDetectionService,
    WebsiteValidationService,
    {
      provide: DISCOVERY_OUTPUT_REPOSITORY,
      useClass: PrismaDiscoveryOutputRepository,
    },
  ],
  exports: [DISCOVERY_OUTPUT_REPOSITORY, DiscoveryOrchestratorService, DiscoveryWorkerProcessorService],
})
export class CompanyDiscoveryModule {}
