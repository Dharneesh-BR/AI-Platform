export class WebsiteUrl {
  private constructor(readonly value: string) {}

  static create(rawUrl: string): WebsiteUrl {
    const url = new URL(rawUrl);

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Website URL must use HTTP or HTTPS.');
    }

    if (this.isBlockedHostname(url.hostname)) {
      throw new Error('Website URL hostname is not allowed.');
    }

    return new WebsiteUrl(url.toString());
  }

  private static isBlockedHostname(hostname: string): boolean {
    const normalized = hostname.toLowerCase();
    return (
      normalized === 'localhost' ||
      normalized.endsWith('.localhost') ||
      normalized === '0.0.0.0' ||
      normalized.startsWith('127.') ||
      normalized.startsWith('10.') ||
      normalized.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)
    );
  }
}

