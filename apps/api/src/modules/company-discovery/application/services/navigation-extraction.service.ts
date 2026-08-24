import { Injectable } from '@nestjs/common';

@Injectable()
export class NavigationExtractionService {
  extract(html: string): string[] {
    return Array.from(html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi))
      .map((match) => String(match[2]).replace(/<[^>]+>/g, '').trim())
      .filter(Boolean)
      .slice(0, 50);
  }
}

