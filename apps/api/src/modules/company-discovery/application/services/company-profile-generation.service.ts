import { Injectable } from '@nestjs/common';

@Injectable()
export class CompanyProfileGenerationService {
  generateInitialSummary(input: {
    companyName: string;
    industry?: string | null;
    productsOrServices: string[];
  }): Record<string, unknown> {
    return {
      companyName: input.companyName,
      industry: input.industry,
      summary: `${input.companyName} operates${input.industry ? ` in ${input.industry}` : ''}.`,
      productsOrServices: input.productsOrServices,
    };
  }
}

