import { BadRequestException } from '@nestjs/common';
import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { DocumentTextExtractionService } from './document-text-extraction.service';

describe('DocumentTextExtractionService', () => {
  const service = new DocumentTextExtractionService();

  it('extracts plain text documents', async () => {
    const result = await service.extract(Buffer.from('Magnafic Test Corporation target is 41 percent.'), 'text/plain', 'target.txt');

    expect(result.text).toContain('41 percent');
    expect(result.metadata.extractionMode).toBe('plain-text');
  });

  it('extracts markdown documents by extension', async () => {
    const result = await service.extract(Buffer.from('# Strategy\n\nPrioritize onboarding.'), undefined, 'strategy.md');

    expect(result.text).toContain('Prioritize onboarding');
  });

  it('extracts valid PDF documents', async () => {
    const result = await service.extract(createPdfFixture('Magnafic renewable revenue target is 41 percent.'), 'application/pdf', 'target.pdf');

    expect(result.text).toContain('41 percent');
    expect(result.metadata.extractionMode).toBe('pdf');
  });

  it('extracts valid DOCX documents', async () => {
    const result = await service.extract(await createDocxFixture('Magnafic DOCX onboarding target is 41 percent.'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'target.docx');

    expect(result.text).toContain('41 percent');
    expect(result.metadata.extractionMode).toBe('docx');
  });

  it('rejects unsupported file types', async () => {
    await expect(service.extract(Buffer.from('test'), 'application/json', 'data.json')).rejects.toThrow(BadRequestException);
  });

  it('rejects corrupt PDFs with a user-safe error', async () => {
    await expect(service.extract(Buffer.from('not-a-pdf'), 'application/pdf', 'broken.pdf')).rejects.toThrow('PDF could not be read');
  });

  it('rejects invalid DOCX files with a user-safe error', async () => {
    await expect(service.extract(Buffer.from('not-a-docx'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'broken.docx')).rejects.toThrow('DOCX could not be read');
  });
});

function createPdfFixture(text: string): Buffer {
  const escapedText = text.replace(/[()\\]/g, '\\$&');
  return Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${escapedText.length + 44} >>
stream
BT /F1 24 Tf 72 720 Td (${escapedText}) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
trailer
<< /Root 1 0 R /Size 6 >>
startxref
0
%%EOF`);
}

async function createDocxFixture(text: string): Promise<Buffer> {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
  zip.folder('_rels')?.file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  zip.folder('word')?.file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body><w:p><w:r><w:t>${escapeXml(text)}</w:t></w:r></w:p></w:body>
</w:document>`);
  return zip.generateAsync({ type: 'nodebuffer' });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
