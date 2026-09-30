import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { dirname, join, posix } from 'path';
import { RagConfigService } from '../../application/services/rag-config.service';

@Injectable()
export class LocalKnowledgeStorageService {
  constructor(private readonly ragConfig: RagConfigService) {}

  async save(input: {
    projectId: string;
    documentId: string;
    originalFilename: string;
    buffer: Buffer;
  }): Promise<{ storageKey: string; checksum: string; uri: string }> {
    const checksum = createHash('sha256').update(input.buffer).digest('hex');
    const storageKey = this.storageKey(input);

    if (this.ragConfig.storageProvider === 'supabase') {
      const uri = await this.saveToSupabase({
        storageKey,
        buffer: input.buffer,
        contentType: this.contentTypeFor(input.originalFilename),
      });

      return { storageKey, checksum, uri };
    }

    const uri = await this.saveToLocal(storageKey, input.buffer);

    return { storageKey, checksum, uri };
  }

  async read(storageKey: string): Promise<Buffer> {
    if (this.ragConfig.storageProvider === 'supabase') {
      return this.readFromSupabase(storageKey);
    }

    return fs.readFile(join(process.cwd(), this.ragConfig.storageDirectory, storageKey));
  }

  private async saveToLocal(storageKey: string, buffer: Buffer): Promise<string> {
    const absolutePath = join(process.cwd(), this.ragConfig.storageDirectory, storageKey);

    await fs.mkdir(dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, buffer);

    return absolutePath;
  }

  private async saveToSupabase(input: {
    storageKey: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<string> {
    const config = this.supabaseConfig();
    const response = await fetch(this.supabaseObjectUrl(config, input.storageKey), {
      method: 'POST',
      headers: {
        ...this.supabaseHeaders(config),
        'Content-Type': input.contentType,
        'x-upsert': 'true',
      },
      body: new Uint8Array(input.buffer),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException(`Supabase document upload failed: ${response.status} ${response.statusText} ${await response.text()}`);
    }

    return `supabase://${config.bucket}/${input.storageKey}`;
  }

  private async readFromSupabase(storageKey: string): Promise<Buffer> {
    const config = this.supabaseConfig();
    const response = await fetch(this.supabaseObjectUrl(config, storageKey), {
      method: 'GET',
      headers: this.supabaseHeaders(config),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException(`Supabase document read failed: ${response.status} ${response.statusText} ${await response.text()}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  private storageKey(input: {
    projectId: string;
    documentId: string;
    originalFilename: string;
  }): string {
    const safeFilename = input.originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return posix.join('projects', input.projectId, 'documents', input.documentId, safeFilename);
  }

  private contentTypeFor(filename: string): string {
    const normalized = filename.toLowerCase();
    if (normalized.endsWith('.pdf')) {
      return 'application/pdf';
    }
    if (normalized.endsWith('.docx')) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    if (normalized.endsWith('.md') || normalized.endsWith('.markdown')) {
      return 'text/markdown; charset=utf-8';
    }
    return 'text/plain; charset=utf-8';
  }

  private supabaseConfig(): { url: string; serviceRoleKey: string; bucket: string } {
    const url = this.ragConfig.supabaseUrl?.replace(/\/+$/, '');
    const serviceRoleKey = this.ragConfig.supabaseServiceRoleKey;

    if (!url || !serviceRoleKey) {
      throw new ServiceUnavailableException('Supabase storage is enabled but SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.');
    }

    return {
      url,
      serviceRoleKey,
      bucket: this.ragConfig.supabaseStorageBucket,
    };
  }

  private supabaseHeaders(config: { serviceRoleKey: string }): Record<string, string> {
    return {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
    };
  }

  private supabaseObjectUrl(config: { url: string; bucket: string }, storageKey: string): string {
    return `${config.url}/storage/v1/object/${encodeURIComponent(config.bucket)}/${this.encodeStorageKey(storageKey)}`;
  }

  private encodeStorageKey(storageKey: string): string {
    return storageKey.split('/').map((part) => encodeURIComponent(part)).join('/');
  }
}
