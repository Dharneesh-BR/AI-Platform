'use client';

import Link from 'next/link';
import { Card, Pill, ProgressBar } from '../../../components/platform/app-shell';
import { useDiscoveryStatus } from '../../../lib/api/query-hooks';
import { useAuth } from '../../../lib/auth/session';

interface DiscoveryProgressProps {
  projectId: string;
}

function getTone(status: string): 'green' | 'amber' | 'slate' | 'blue' {
  if (status === 'SUCCEEDED' || status === 'COMPLETED') return 'green';
  if (status === 'RUNNING' || status === 'PENDING') return 'amber';
  if (status === 'FAILED') return 'slate';
  return 'blue';
}

export function DiscoveryProgress({ projectId }: DiscoveryProgressProps) {
  const { session } = useAuth();
  const discoveryQuery = useDiscoveryStatus(projectId, {
    accessToken: session.accessToken,
    organizationId: session.organizationId,
  });
  const status = discoveryQuery.data;

  return (
    <div>
      <header className="topbar">
        <div>
          <span className="eyebrow">Async Company Discovery</span>
          <h1>Discovery runs in the background.</h1>
          <p>Heavy analysis is handled through BullMQ, with progress polling so the interface never blocks.</p>
        </div>
        <div className="topbar-actions">
          <Link className="button button-muted" href={`/projects/${projectId}`}>Back to project</Link>
          <Link className="button button-primary" href={`/projects/${projectId}/company-profile`}>Open company profile</Link>
        </div>
      </header>

      <section className="grid-2">
        <Card>
          <div className="pill-row">
            <Pill tone="green">Live API</Pill>
            <Pill tone={getTone(status?.status ?? 'PENDING')}>{status?.status ?? 'Not started'}</Pill>
          </div>
          <h2 className="section-gap">{status?.progress ?? 0}% complete</h2>
          <ProgressBar value={status?.progress ?? 0} />
          <p className="section-gap">Current step: {status?.currentStep ?? 'Waiting for discovery job data.'}</p>
        </Card>
        <Card>
          <h2>System guarantees</h2>
          <div className="timeline">
            <div className="timeline-item"><strong>No blocking HTTP</strong><span>Queue-first processing</span></div>
            <div className="timeline-item"><strong>Retry support</strong><span>Exponential backoff</span></div>
            <div className="timeline-item"><strong>Tenant isolation</strong><span>Organization scoped job data</span></div>
          </div>
        </Card>
      </section>

      <section className="card section-gap">
        <div className="pill-row">
          <Pill tone={discoveryQuery.isError ? 'amber' : 'green'}>{discoveryQuery.isError ? 'API unavailable' : 'Ready'}</Pill>
        </div>
        <h2 className="section-gap">Discovery checklist</h2>
        {status?.steps?.length ? (
          <div className="timeline section-gap">
            {status.steps.map((step) => (
              <div key={step.key} className="timeline-item">
                <div><strong>{step.label}</strong><p>{step.key}</p></div>
                <Pill tone={getTone(step.status)}>{step.status}</Pill>
              </div>
            ))}
          </div>
        ) : (
          <p className="section-gap">No discovery job is available yet. Complete onboarding to enqueue discovery.</p>
        )}
      </section>
    </div>
  );
}