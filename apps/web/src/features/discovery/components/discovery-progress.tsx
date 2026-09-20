'use client';

import Link from 'next/link';
import { Card, Pill, ProgressBar } from '../../../components/platform/app-shell';
import { useCompleteOnboarding, useDiscoveryStatus } from '../../../lib/api/query-hooks';
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
  const completeOnboardingMutation = useCompleteOnboarding(projectId, {
    accessToken: session.accessToken,
    organizationId: session.organizationId,
  });
  const status = discoveryQuery.data;
  const isFinished = status?.status === 'SUCCEEDED' || status?.status === 'COMPLETED';
  const isRunning = status?.status === 'RUNNING';
  const isWaiting = !status || status.status === 'PENDING' || status.status === 'QUEUED';
  const canStartDiscovery = isWaiting || status?.status === 'FAILED';

  const handleStartDiscovery = async () => {
    await completeOnboardingMutation.mutateAsync();
    await discoveryQuery.refetch();
  };

  return (
    <div>
      <header className="topbar">
        <div>
          <span className="eyebrow">Async Company Discovery</span>
          <h1>Discovery runs in the background.</h1>
          <p>Discovery builds a first company profile from onboarding inputs and prepares the project workspace.</p>
        </div>
        <div className="topbar-actions">
          <Link className="button button-muted" href={`/projects/${projectId}`}>Back to project</Link>
          <Link className="button button-primary" href={`/projects/${projectId}/company-profile`}>Review profile</Link>
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
          <p className="section-gap">
            {isFinished
              ? 'Discovery is complete. Review the profile and continue the project.'
              : isRunning
                ? `Current step: ${status?.currentStep ?? 'Preparing discovery.'}`
                : 'Discovery has not completed yet. Start it now to build the first company profile.'}
          </p>
          {canStartDiscovery ? (
            <button
              className="button button-primary section-gap"
              type="button"
              onClick={handleStartDiscovery}
              disabled={completeOnboardingMutation.isPending}
            >
              {completeOnboardingMutation.isPending ? 'Starting discovery...' : 'Run discovery now'}
            </button>
          ) : null}
          {completeOnboardingMutation.isError ? (
            <p className="form-error">Discovery could not start. Please check the API deployment and try again.</p>
          ) : null}
        </Card>
        <Card>
          <h2>System guarantees</h2>
          <div className="timeline">
            <div className="timeline-item"><strong>Company profile</strong><span>Generated from onboarding inputs</span></div>
            <div className="timeline-item"><strong>Knowledge seed</strong><span>Discovery profile is saved as project context</span></div>
            <div className="timeline-item"><strong>Next action</strong><span>Review profile, then add documents</span></div>
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
          <div className="section-gap">
            <p>No discovery job is available yet. Complete onboarding to start discovery.</p>
            <Link className="button button-primary" href={`/projects/${projectId}/onboarding`}>Open onboarding</Link>
          </div>
        )}
      </section>
    </div>
  );
}
