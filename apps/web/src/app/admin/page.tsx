import { Card, MetricCard, Pill } from '../../components/platform/app-shell';

export default function AdminPage() {
  return (
    <main className="workspace">
      <header className="topbar"><div><span className="eyebrow">Admin</span><h1>Platform operations cockpit.</h1><p>Monitor tenants, users, model usage, audit events, and system health.</p></div><button className="button button-primary">Run health check</button></header>
      <section className="grid-3"><MetricCard label="Tenants" value="4" detail="Active organizations." /><MetricCard label="Users" value="28" detail="Across all roles." /><MetricCard label="Audit events" value="1,284" detail="Security activity captured." /></section>
      <section className="card section-gap"><h2>System status</h2><div className="timeline section-gap"><div className="timeline-item"><strong>API</strong><Pill tone="green">Healthy</Pill></div><div className="timeline-item"><strong>Redis queues</strong><Pill tone="amber">Local pending</Pill></div><div className="timeline-item"><strong>PostgreSQL</strong><Pill tone="amber">Local pending</Pill></div></div></section>
    </main>
  );
}