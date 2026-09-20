import { MetricCard, Pill } from '../../../../components/platform/app-shell';

export default function OrganizationDetailPage() {
  return (
    <div>
      <header className="topbar"><div><span className="eyebrow">Organization</span><h1>Workspace details</h1><p>Workspace settings, connected users, projects, and governance controls.</p></div><button className="button button-primary">Invite member</button></header>
      <section className="grid-3"><MetricCard label="Projects" value="Live" detail="Across all lifecycle states." /><MetricCard label="Members" value="Live" detail="Connected workspace users." /><MetricCard label="Audit" value="On" detail="Sensitive operations are tracked." /></section>
      <section className="card section-gap"><h2>Workspace access</h2><div className="timeline section-gap"><div className="timeline-item"><strong>Signed-in users</strong><Pill>Live API</Pill></div><div className="timeline-item"><strong>Project collaborators</strong><Pill tone="green">Workspace</Pill></div><div className="timeline-item"><strong>Stakeholder access</strong><Pill tone="slate">Planned</Pill></div></div></section>
    </div>
  );
}
