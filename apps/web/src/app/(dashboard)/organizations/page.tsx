import { MetricCard } from '../../../components/platform/app-shell';
import { CreateOrganizationCard } from '../../../features/organizations/components/create-organization-card';
import { LiveOrganizationsList } from '../../../features/organizations/components/live-organizations-list';

export default function OrganizationsPage() {
  return (
    <div>
      <header className="topbar">
        <div>
          <span className="eyebrow">Organizations</span>
          <h1>Manage tenant workspaces and memberships.</h1>
          <p>Organizations are the primary tenant boundary for projects, discovery, research, billing, and audit logs.</p>
        </div>
        <button className="button button-primary">Create organization</button>
      </header>
      <section className="grid-3">
        <MetricCard label="Organizations" value="4" detail="Active tenant workspaces." />
        <MetricCard label="Members" value="Live" detail="People connected to the workspace." />
        <MetricCard label="Isolation" value="Strict" detail="All project records are organization scoped." />
      </section>
      <section className="section-gap">
        <CreateOrganizationCard />
      </section>
      <LiveOrganizationsList />
    </div>
  );
}
