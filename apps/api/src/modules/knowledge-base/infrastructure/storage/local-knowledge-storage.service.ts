import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
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
    const safeFilename = input.originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = join(input.projectId, `${input.documentId}-${safeFilename}`);
    const absolutePath = join(process.cwd(), this.ragConfig.storageDirectory, storageKey);

    await fs.mkdir(dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, input.buffer);

    return {
      storageKey,
      checksum,
      uri: absolutePath,
    };
  }

  async read(storageKey: string): Promise<Buffer> {
    return fs.readFile(join(process.cwd(), this.ragConfig.storageDirectory, storageKey));
  }
}
