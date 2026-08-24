import { Card, MetricCard, Pill } from '../../../../../components/platform/app-shell';

export default function KnowledgePage() {
  return (
    <div>
      <header className="topbar"><div><span className="eyebrow">Knowledge Base</span><h1>Search project context and discovery sources.</h1><p>Semantic search will combine uploaded documents, website discovery, meeting notes, and consulting frameworks.</p></div><button className="button button-primary">Upload document</button></header>
      <section className="grid-3"><MetricCard label="Documents" value="12" detail="PDFs, decks, spreadsheets, notes." /><MetricCard label="Chunks" value="486" detail="Prepared for embeddings." /><MetricCard label="Vector search" value="pgvector" detail="Semantic retrieval foundation." /></section>
      <section className="card section-gap"><h2>Recent sources</h2><div className="timeline section-gap"><div className="timeline-item"><strong>Company profile v1</strong><Pill tone="green">Approved</Pill></div><div className="timeline-item"><strong>Website discovery summary</strong><Pill>Research source</Pill></div><div className="timeline-item"><strong>Brand guidelines</strong><Pill tone="slate">Uploaded</Pill></div></div></section>
    </div>
  );
}