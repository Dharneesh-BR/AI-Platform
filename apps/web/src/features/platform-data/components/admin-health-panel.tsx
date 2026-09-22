'use client';

import { MetricCard, Pill } from '../../../components/platform/app-shell';
import { useAdminHealth } from '../../../lib/api/query-hooks';
import { useAuth } from '../../../lib/auth/session';

export function AdminHealthPanel() {
  const { session } = useAuth();
  const healthQuery = useAdminHealth({
    accessToken: session.accessToken,
  });
  const health = healthQuery.data;

  if (!session.accessToken) {
    return <p>Sign in with an admin Firebase account to view live platform health.</p>;
  }

  return (
    <>
      <section className="grid-3">
        <MetricCard label="Projects" value={String(health?.counts.projects ?? '—')} detail="Live project count." />
        <MetricCard label="Users" value={String(health?.counts.users ?? '—')} detail="Live user count." />
        <MetricCard label="Audit events" value={String(health?.counts.auditEvents ?? '—')} detail="Recorded system activity." />
      </section>

      <section className="card section-gap">
        <div className="pill-row">
          <Pill tone={health?.status === 'healthy' ? 'green' : 'amber'}>
            {healthQuery.isLoading ? 'Checking' : health?.status ?? 'Unavailable'}
          </Pill>
          {health?.checkedAt ? <Pill tone="slate">{new Date(health.checkedAt).toLocaleString()}</Pill> : null}
        </div>
        <h2 className="section-gap">System status</h2>
        <div className="timeline section-gap">
          {(health?.services ?? []).map((service) => (
            <div className="timeline-item" key={service.name}>
              <div>
                <strong>{service.name}</strong>
                <p>{service.detail}</p>
              </div>
              <Pill tone={service.status === 'healthy' ? 'green' : 'amber'}>{service.status}</Pill>
            </div>
          ))}
        </div>
        {healthQuery.isError ? <p>Unable to load platform health. Check API and admin permissions.</p> : null}
      </section>
    </>
  );
}
