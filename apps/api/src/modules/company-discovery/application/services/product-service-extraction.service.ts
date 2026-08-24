import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductServiceExtractionService {
  extract(text: string): string[] {
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /product|service|solution|platform/i.test(line))
      .slice(0, 25);
  }
}

