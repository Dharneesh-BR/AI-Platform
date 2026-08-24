import { Injectable } from '@nestjs/common';
import { CompanyProfileGenerationService } from './company-profile-generation.service';
import { ContentExtractionService } from './content-extraction.service';
import { MetadataExtractionService } from './metadata-extraction.service';
import { NavigationExtractionService } from './navigation-extraction.service';
import { ProductServiceExtractionService } from './product-service-extraction.service';
import { TechnologyDetectionService } from './technology-detection.service';
import { WebsiteValidationService } from './website-validation.service';

@Injectable()
export class DiscoveryOrchestratorService {
  constructor(
    private readonly websiteValidationService: WebsiteValidationService,
    private readonly metadataExtractionService: MetadataExtractionService,
    private readonly productServiceExtractionService: ProductServiceExtractionService,
    private readonly navigationExtractionService: NavigationExtractionService,
    private readonly contentExtractionService: ContentExtractionService,
    private readonly technologyDetectionService: TechnologyDetectionService,
    private readonly companyProfileGenerationService: CompanyProfileGenerationService,
  ) {}

  prepareWebsiteDiscovery(input: {
    companyName: string;
    websiteUrl: string;
    industry?: string | null;
    html: string;
    headers?: Record<string, string | string[] | undefined>;
  }): Record<string, unknown> {
    const websiteUrl = this.websiteValidationService.validate(input.websiteUrl);
    const text = this.contentExtractionService.extractText(input.html);
    const productsOrServices = this.productServiceExtractionService.extract(text);

    return {
      websiteUrl: websiteUrl.value,
      metadata: this.metadataExtractionService.extract(input.html),
      navigation: this.navigationExtractionService.extract(input.html),
      productsOrServices,
      technologies: this.technologyDetectionService.detect(input.html, input.headers),
      initialSummary: this.companyProfileGenerationService.generateInitialSummary({
        companyName: input.companyName,
        industry: input.industry,
        productsOrServices,
      }),
    };
  }
}

