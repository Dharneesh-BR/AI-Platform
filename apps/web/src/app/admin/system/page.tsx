import { Card, Pill } from '../../../components/platform/app-shell';

export default function SystemPage() {
  return <main className="workspace"><section className="card"><span className="eyebrow">System</span><h1>Runtime health.</h1><p>Operational checks for API, workers, Redis, PostgreSQL, storage, and model gateway.</p><div className="timeline section-gap"><div className="timeline-item"><strong>Web</strong><Pill tone="green">Running</Pill></div><div className="timeline-item"><strong>API</strong><Pill tone="slate">Not started</Pill></div></div></section></main>;
}