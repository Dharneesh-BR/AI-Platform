import { Injectable } from '@nestjs/common';
import { WebsiteUrl } from '../../../website-analysis/domain/value-objects/website-url.value-object';

@Injectable()
export class WebsiteValidationService {
  validate(rawUrl: string): WebsiteUrl {
    return WebsiteUrl.create(rawUrl);
  }
}

