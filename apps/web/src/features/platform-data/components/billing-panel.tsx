'use client';

import { MetricCard, Pill } from '../../../components/platform/app-shell';
import { useBillingAccount } from '../../../lib/api/query-hooks';
import { useAuth } from '../../../lib/auth/session';

export function BillingPanel() {
  const { session } = useAuth();
  const billingQuery = useBillingAccount({ accessToken: session.accessToken });
  const account = billingQuery.data;
  const plan = account?.planKey ?? '—';
  const status = account?.status ?? 'Unavailable';
  const usageCount = account?.usageRecords.length ?? 0;

  return (
    <>
      <section className="grid-3">
        <MetricCard label="Plan" value={plan} detail="Loaded from backend." />
        <MetricCard label="Status" value={status} detail="Subscription health." />
        <MetricCard label="Usage records" value={String(usageCount)} detail="Metered backend events." />
      </section>
      <section className="card section-gap">
        <div className="pill-row">
          <Pill tone="green">Live API</Pill>
          <Pill tone={billingQuery.isError ? 'amber' : 'green'}>{billingQuery.isError ? 'API unavailable' : 'Ready'}</Pill>
        </div>
        <h2 className="section-gap">Usage breakdown</h2>
        {account?.usageRecords.length ? (
          <div className="timeline">
            {account.usageRecords.map((record) => (
              <div className="timeline-item" key={record.id}>
                <strong>{record.metricKey}</strong>
                <span>{record.quantity}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No usage records exist yet.</p>
        )}
      </section>
    </>
  );
}
