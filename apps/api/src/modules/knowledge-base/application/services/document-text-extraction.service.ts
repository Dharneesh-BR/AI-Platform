import { BadRequestException, Injectable } from '@nestjs/common';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

export interface ExtractedDocumentText {
  text: string;
  metadata: Record<string, unknown>;
}

const supportedMimeTypes = new Set([
  'text/plain',
  'text/markdown',
  'application/markdown',
  'text/x-markdown',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

@Injectable()
export class DocumentTextExtractionService {
  async extract(buffer: Buffer, mimeType?: string | null, filename?: string | null): Promise<ExtractedDocumentText> {
    const normalizedMimeType = mimeType?.toLowerCase() ?? 'text/plain';

    if (this.isPdf(normalizedMimeType, filename)) {
      return this.extractPdf(buffer);
    }

    if (this.isDocx(normalizedMimeType, filename)) {
      return this.extractDocx(buffer);
    }

    if (!supportedMimeTypes.has(normalizedMimeType) && !this.isTextFilename(filename)) {
      throw new BadRequestException('Unsupported file type. TXT, Markdown, PDF, and DOCX are supported.');
    }

    const text = this.stripNullCharacters(buffer.toString('utf8')).trim();

    if (!text) {
      throw new BadRequestException('Uploaded document is empty.');
    }

    return {
      text,
      metadata: {
        extractionMode: 'plain-text',
        characterCount: text.length,
      },
    };
  }

  private async extractPdf(buffer: Buffer): Promise<ExtractedDocumentText> {
    let parser: PDFParse | undefined;
    try {
      parser = new PDFParse({ data: new Uint8Array(buffer), stopAtErrors: true });
      const parsed = await parser.getText();
      const text = this.stripNullCharacters(parsed.text).trim();

      if (!text) {
        throw new BadRequestException('PDF has no extractable text. Scanned/image-only PDFs are not currently supported.');
      }

      return {
        text,
        metadata: {
          extractionMode: 'pdf',
          characterCount: text.length,
          pageCount: parsed.total,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('PDF could not be read. It may be corrupt, encrypted, or image-only.');
    } finally {
      await parser?.destroy();
    }
  }

  private async extractDocx(buffer: Buffer): Promise<ExtractedDocumentText> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = this.stripNullCharacters(result.value).trim();

      if (!text) {
        throw new BadRequestException('DOCX has no extractable text.');
      }

      return {
        text,
        metadata: {
          extractionMode: 'docx',
          characterCount: text.length,
          warnings: result.messages.map((message) => message.message).slice(0, 10),
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('DOCX could not be read. It may be corrupt or unsupported.');
    }
  }

  private isPdf(mimeType: string, filename?: string | null): boolean {
    return mimeType === 'application/pdf' || filename?.toLowerCase().endsWith('.pdf') === true;
  }

  private isDocx(mimeType: string, filename?: string | null): boolean {
    return (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      filename?.toLowerCase().endsWith('.docx') === true
    );
  }

  private isTextFilename(filename?: string | null): boolean {
    const normalized = filename?.toLowerCase() ?? '';
    return normalized.endsWith('.txt') || normalized.endsWith('.md') || normalized.endsWith('.markdown');
  }

  private stripNullCharacters(value: string): string {
    return value.split('\u0000').join('');
  }
}
