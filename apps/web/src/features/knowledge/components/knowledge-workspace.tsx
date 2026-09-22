'use client';

import { useState } from 'react';
import { Card, MetricCard, Pill } from '../../../components/platform/app-shell';
import {
  useCreateKnowledgeSource,
  useDeleteKnowledgeDocument,
  useKnowledgeDocuments,
  useKnowledgeSources,
  useRetryKnowledgeDocument,
  useSearchKnowledge,
  useUploadKnowledgeDocument,
} from '../../../lib/api/query-hooks';
import { useAuth } from '../../../lib/auth/session';

interface KnowledgeWorkspaceProps {
  projectId: string;
}

function summarizeContent(content: unknown): string {
  if (content && typeof content === 'object' && 'text' in content) {
    const text = (content as { text?: unknown }).text;
    return typeof text === 'string' ? text : JSON.stringify(content);
  }

  return typeof content === 'string' ? content : JSON.stringify(content);
}

export function KnowledgeWorkspace({ projectId }: KnowledgeWorkspaceProps) {
  const { session } = useAuth();
  const authContext = {
    accessToken: session.accessToken,
  };
  const knowledgeSources = useKnowledgeSources(projectId, authContext);
  const knowledgeDocuments = useKnowledgeDocuments(projectId, authContext);
  const createKnowledgeSource = useCreateKnowledgeSource(projectId, authContext);
  const uploadKnowledgeDocument = useUploadKnowledgeDocument(projectId, authContext);
  const retryKnowledgeDocument = useRetryKnowledgeDocument(projectId, authContext);
  const deleteKnowledgeDocument = useDeleteKnowledgeDocument(projectId, authContext);
  const searchKnowledge = useSearchKnowledge(projectId, authContext);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('What should we prioritize first?');
  const [message, setMessage] = useState('Add real project notes, strategy context, call summaries, or document extracts.');

  async function submitKnowledge() {
    if (!session.accessToken) {
      setMessage('Sign in with Firebase before adding knowledge.');
      return;
    }

    if (title.trim().length < 2 || content.trim().length < 10) {
      setMessage('Add a title and at least 10 characters of content.');
      return;
    }

    await createKnowledgeSource.mutateAsync({
      title: title.trim(),
      content: content.trim(),
      type: 'UPLOADED_DOCUMENT',
      metadata: { source: 'manual-entry' },
    });
    setTitle('');
    setContent('');
    setMessage('Knowledge source added to the live project context.');
  }

  async function uploadDocument() {
    if (!selectedFile) {
      setMessage('Choose a TXT, Markdown, PDF, or DOCX file first.');
      return;
    }

    await uploadKnowledgeDocument.mutateAsync(selectedFile);
    setSelectedFile(null);
    setMessage('Document uploaded and queued for RAG processing.');
  }

  async function runSearch() {
    if (searchQuery.trim().length < 2) {
      setMessage('Enter a search question first.');
      return;
    }

    await searchKnowledge.mutateAsync({ query: searchQuery.trim(), limit: 5 });
    setMessage('Knowledge search completed against project-scoped vectors.');
  }

  const sources = knowledgeSources.data ?? [];
  const documents = knowledgeDocuments.data ?? [];
  const totalCharacters = sources.reduce((total, source) => {
    const count = source.metadata?.characterCount;
    return total + (typeof count === 'number' ? count : summarizeContent(source.content).length);
  }, 0);

  return (
    <div>
      <header className="topbar">
        <div>
          <span className="eyebrow">Knowledge Base</span>
          <h1>Build the project memory used by research, chat, and reports.</h1>
          <p>Every source added here is stored in Supabase and used as live context for AI workflows.</p>
        </div>
        <Pill tone="green">Live Supabase</Pill>
      </header>

      <section className="grid-3">
        <MetricCard label="Sources" value={String(sources.length)} detail="Loaded from the live API." />
        <MetricCard label="Documents" value={String(documents.length)} detail="Uploaded and processed through BullMQ." />
        <MetricCard label="Characters" value={String(totalCharacters)} detail="Available context volume." />
      </section>

      <section className="grid-2 section-gap">
        <Card>
          <h2>Upload company document</h2>
          <p>Supported now: TXT, Markdown, PDF, and DOCX. Scanned/image-only PDFs are not currently supported.</p>
          <div className="field section-gap upload-dropzone">
            <label>Document file</label>
            <input
              type="file"
              accept=".txt,.md,.markdown,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
            <p className="section-gap">Files are processed through the document queue, embedded, and made available to RAG search.</p>
          </div>
          <button
            className="button button-primary section-gap"
            onClick={() => void uploadDocument()}
            disabled={uploadKnowledgeDocument.isPending}
            type="button"
          >
            Upload and process
          </button>
          <p className="section-gap">{selectedFile ? selectedFile.name : 'No file selected.'}</p>
        </Card>

        <Card>
          <h2>Add pasted knowledge</h2>
          <div className="field section-gap">
            <label>Source title</label>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Q4 strategy notes" />
          </div>
          <div className="field section-gap">
            <label>Content</label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Paste real meeting notes, project facts, strategy context, or document text."
              rows={8}
            />
          </div>
          <button
            className="button button-primary section-gap"
            onClick={() => void submitKnowledge()}
            disabled={createKnowledgeSource.isPending}
            type="button"
          >
            Add to project knowledge
          </button>
          <p className="section-gap">{message}</p>
        </Card>
      </section>

      <section className="grid-2 section-gap">
        <Card>
          <h2>Documents</h2>
          {knowledgeDocuments.isLoading ? <p>Loading documents...</p> : null}
          {knowledgeDocuments.isError ? <p>Unable to load documents. Check API session and organization context.</p> : null}
          {!knowledgeDocuments.isLoading && documents.length === 0 ? (
            <p>No documents yet. Upload TXT or Markdown to activate vector retrieval.</p>
          ) : null}
          <div className="timeline section-gap">
            {documents.map((document) => (
              <div className="timeline-item" key={document.id}>
                <div>
                  <strong>{document.title}</strong>
                  <span>{document._count?.chunks ?? 0} chunks · {document.mimeType ?? 'unknown type'}</span>
                  {document.processingError ? <p>{document.processingError}</p> : null}
                </div>
                <div className="topbar-actions">
                  <Pill tone={document.status === 'READY' ? 'green' : document.status === 'FAILED' ? 'amber' : 'blue'}>{document.status}</Pill>
                  {document.status === 'FAILED' ? (
                    <button className="button button-muted" onClick={() => void retryKnowledgeDocument.mutateAsync(document.id)}>Retry</button>
                  ) : null}
                  <button className="button button-ghost" onClick={() => void deleteKnowledgeDocument.mutateAsync(document.id)}>Archive</button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2>Test retrieval</h2>
          <div className="field section-gap">
            <label>Question</label>
            <textarea value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} rows={4} />
          </div>
          <button className="button button-primary section-gap" onClick={() => void runSearch()} disabled={searchKnowledge.isPending}>
            Search project knowledge
          </button>
          <div className="timeline section-gap">
            {(searchKnowledge.data ?? []).map((result) => (
              <div className="timeline-item" key={result.chunkId}>
                <div>
                  <strong>{result.documentName}</strong>
                  <span>{result.content.slice(0, 220)}</span>
                </div>
                <Pill tone="green">{result.similarity.toFixed(2)}</Pill>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
