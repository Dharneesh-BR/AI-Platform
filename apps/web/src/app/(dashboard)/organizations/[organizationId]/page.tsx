import { Card, MetricCard, Pill } from '../../../../components/platform/app-shell';

export default function OrganizationDetailPage() {
  return (
    <div>
      <header className="topbar"><div><span className="eyebrow">Organization</span><h1>Magnafic AI</h1><p>Tenant settings, members, projects, and governance controls.</p></div><button className="button button-primary">Invite member</button></header>
      <section className="grid-3"><MetricCard label="Projects" value="12" detail="Across all lifecycle states." /><MetricCard label="Members" value="18" detail="Role-based access control enabled." /><MetricCard label="Audit" value="On" detail="Sensitive operations are tracked." /></section>
      <section className="card section-gap"><h2>Memberships</h2><div className="timeline section-gap"><div className="timeline-item"><strong>Admin User</strong><Pill>ADMIN</Pill></div><div className="timeline-item"><strong>Consultant Team</strong><Pill>CONSULTANT</Pill></div><div className="timeline-item"><strong>Client Stakeholder</strong><Pill tone="slate">CLIENT</Pill></div></div></section>
    </div>
  );
}