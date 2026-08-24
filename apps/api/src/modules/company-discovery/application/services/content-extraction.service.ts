import { Injectable } from '@nestjs/common';

@Injectable()
export class ContentExtractionService {
  extractText(html: string): string {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

