'use client';

import Link from 'next/link';
import { Card, Pill } from '../../../components/platform/app-shell';
import { useOrganizations } from '../../../lib/api/query-hooks';
import { useAuth } from '../../../lib/auth/session';

export function LiveOrganizationsList() {
  const { session } = useAuth();
  const organizationsQuery = useOrganizations({ accessToken: session.accessToken, organizationId: session.organizationId });
  const organizations = organizationsQuery.data ?? [];

  if (organizationsQuery.isLoading) {
    return <Card><h2>Loading organizations</h2><p>Fetching tenant workspaces from the live API.</p></Card>;
  }

  if (organizationsQuery.isError) {
    return <Card><h2>Organizations unavailable</h2><p>Start the API and log in with a live session to view organizations.</p></Card>;
  }

  if (!organizations.length) {
    return <Card><h2>No organizations yet</h2><p>Create an organization after live auth is available.</p></Card>;
  }

  return (
    <section className="stack section-gap">
      {organizations.map((organization) => (
        <Link key={organization.id} href={`/organizations/${organization.id}`} className="card">
          <div className="topbar" style={{ marginBottom: 0 }}>
            <div><h2>{organization.name}</h2><p>{organization.description ?? 'Workspace for project delivery, knowledge, and AI consulting operations.'}</p></div>
            <Pill tone="green">Live API</Pill>
          </div>
        </Link>
      ))}
    </section>
  );
}