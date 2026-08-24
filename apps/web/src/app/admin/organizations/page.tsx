import { Card, Pill } from '../../../components/platform/app-shell';

export default function AdminOrganizationsPage() {
  return <main className="workspace"><section className="card"><span className="eyebrow">Admin</span><h1>Organizations</h1><p>Platform-level tenant visibility and moderation.</p><div className="timeline section-gap"><div className="timeline-item"><strong>Magnafic AI</strong><Pill tone="green">Active</Pill></div><div className="timeline-item"><strong>Apex Strategy Group</strong><Pill tone="green">Active</Pill></div></div></section></main>;
}