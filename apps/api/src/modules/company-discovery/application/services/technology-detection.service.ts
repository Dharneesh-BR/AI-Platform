import { Injectable } from '@nestjs/common';

@Injectable()
export class TechnologyDetectionService {
  detect(html: string, headers: Record<string, string | string[] | undefined> = {}): string[] {
    const technologies = new Set<string>();

    if (/wp-content|wordpress/i.test(html)) {
      technologies.add('WordPress');
    }

    if (/__NEXT_DATA__|next\/static/i.test(html)) {
      technologies.add('Next.js');
    }

    if (/shopify/i.test(html)) {
      technologies.add('Shopify');
    }

    if (headers['x-powered-by']) {
      technologies.add(String(headers['x-powered-by']));
    }

    return Array.from(technologies);
  }
}

