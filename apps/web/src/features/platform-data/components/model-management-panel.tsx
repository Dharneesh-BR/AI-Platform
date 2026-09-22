'use client';

import { MetricCard, Pill } from '../../../components/platform/app-shell';
import { useModelProviders } from '../../../lib/api/query-hooks';
import { useAuth } from '../../../lib/auth/session';

export function ModelManagementPanel() {
  const { session } = useAuth();
  const providersQuery = useModelProviders({ accessToken: session.accessToken });
  const providers = providersQuery.data ?? [];
  const modelCount = providers.reduce((total, provider) => total + provider.models.length, 0);

  return (
    <>
      <section className="grid-3">
        <MetricCard label="Providers" value={String(providers.length)} detail="Loaded from backend." />
        <MetricCard label="Models" value={String(modelCount)} detail="Available routing targets." />
        <MetricCard label="Routing" value="Config" detail="No hardcoded providers." />
      </section>
      <section className="card section-gap">
        <div className="pill-row">
          <Pill tone="green">Live API</Pill>
          <Pill tone={providersQuery.isError ? 'amber' : 'green'}>{providersQuery.isError ? 'API unavailable' : 'Ready'}</Pill>
        </div>
        <h2 className="section-gap">Model providers</h2>
        <div className="timeline">
          {providers.map((provider) => (
            <div className="timeline-item" key={provider.id}>
              <div>
                <strong>{provider.name}</strong>
                <p>{provider.models.map((model) => model.displayName).join(', ') || 'No models configured'}</p>
              </div>
              <Pill tone={provider.enabled ? 'green' : 'slate'}>{provider.enabled ? 'Enabled' : 'Disabled'}</Pill>
            </div>
          ))}
        </div>
        {!providersQuery.isLoading && !providersQuery.isError && providers.length === 0 ? (
          <p className="section-gap">No model providers are configured yet.</p>
        ) : null}
      </section>
    </>
  );
}
