import { Injectable } from '@nestjs/common';

@Injectable()
export class MetadataExtractionService {
  extract(html: string): Record<string, unknown> {
    return {
      title: this.matchContent(html, /<title>(.*?)<\/title>/i),
      description: this.matchContent(html, /<meta\s+name=["']description["']\s+content=["'](.*?)["']/i),
    };
  }

  private matchContent(html: string, expression: RegExp): string | null {
    return expression.exec(html)?.[1]?.trim() ?? null;
  }
}

