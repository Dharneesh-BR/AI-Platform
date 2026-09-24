'use client';

import { useState } from 'react';
import Link from 'next/link';
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

    try {
      await createKnowledgeSource.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        type: 'UPLOADED_DOCUMENT',
        metadata: { source: 'manual-entry' },
      });
      setTitle('');
      setContent('');
      setMessage('Knowledge source added. The project can now use it for chat, research, and reports.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to add knowledge source.');
    }
  }

  async function uploadDocument() {
    if (!selectedFile) {
      setMessage('Choose a TXT, Markdown, PDF, or DOCX file first.');
      return;
    }

    try {
      await uploadKnowledgeDocument.mutateAsync(selectedFile);
      setSelectedFile(null);
      setMessage('Document uploaded. Processing runs inline unless a Redis worker is enabled.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to upload document.');
    }
  }

  async function runSearch() {
    if (searchQuery.trim().length < 2) {
      setMessage('Enter a search question first.');
      return;
    }

    try {
      const results = await searchKnowledge.mutateAsync({ query: searchQuery.trim(), limit: 5 });
      setMessage(results.length ? 'Knowledge search completed against project-scoped context.' : 'No matching sources or chunks found yet. Add or process knowledge, then search again.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to search project knowledge.');
    }
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
          <p>Add notes or upload documents to turn approved company context into searchable project memory.</p>
        </div>
        <div className="topbar-actions">
          <Link className="button button-muted" href={`/projects/${projectId}`}>Project workspace</Link>
          <Link className="button button-primary" href={`/projects/${projectId}/chat`}>Open AI chat</Link>
        </div>
      </header>

      <section className="grid-3">
        <MetricCard label="Sources" value={String(sources.length)} detail="Manual notes and processed document summaries." />
        <MetricCard label="Documents" value={String(documents.length)} detail="Uploaded files tracked by processing status." />
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
            <p className="section-gap">Files are extracted, chunked, embedded, and made available to project search.</p>
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
          {knowledgeDocuments.isError ? <p>Unable to load documents. Check the API session and project access.</p> : null}
          {!knowledgeDocuments.isLoading && documents.length === 0 ? (
            <p>No documents yet. Upload a document or add pasted knowledge to build project memory.</p>
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
                    <button
                      className="button button-muted"
                      onClick={() => {
                        setMessage(`Retrying ${document.title}.`);
                        void retryKnowledgeDocument.mutateAsync(document.id).catch((error: unknown) => {
                          setMessage(error instanceof Error ? error.message : 'Unable to retry document.');
                        });
                      }}
                    >
                      Retry
                    </button>
                  ) : null}
                  <button
                    className="button button-ghost"
                    onClick={() => {
                      setMessage(`Archiving ${document.title}.`);
                      void deleteKnowledgeDocument.mutateAsync(document.id).then(() => {
                        setMessage('Document archived.');
                      }).catch((error: unknown) => {
                        setMessage(error instanceof Error ? error.message : 'Unable to archive document.');
                      });
                    }}
                  >
                    Archive
                  </button>
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
          {!searchKnowledge.isPending && searchKnowledge.data?.length === 0 ? (
            <p className="section-gap">No matching knowledge sources or chunks found.</p>
          ) : null}
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
