'use client';

import { Card, Pill } from '../../../components/platform/app-shell';
import { useCompanyProfile } from '../../../lib/api/query-hooks';
import { useAuth } from '../../../lib/auth/session';
import { CompanyProfileActions } from './company-profile-actions';

interface CompanyProfileReviewProps {
  projectId: string;
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : 'Not provided';
  }

  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  return 'Not provided';
}

export function CompanyProfileReview({ projectId }: CompanyProfileReviewProps) {
  const { session } = useAuth();
  const profileQuery = useCompanyProfile(projectId, {
    accessToken: session.accessToken,
    organizationId: session.organizationId,
  });
  const profile = profileQuery.data;

  const profileBlocks = profile
    ? [
        ['Mission', profile.mission],
        ['Vision', profile.vision],
        ['Industry', profile.industry],
        ['Products', profile.products],
        ['Services', profile.services],
        ['Target Customers', profile.targetCustomers],
        ['Pain Points', profile.painPoints],
        ['Unique Selling Proposition', profile.uniqueSellingProposition],
      ]
    : [];

  return (
    <div>
      <header className="topbar">
        <div>
          <span className="eyebrow">Company Profile Review</span>
          <h1>Approve the company context before AI starts answering.</h1>
          <p>Discovery output stays editable. Approval locks the current version and creates trusted context for research and AI workflows.</p>
        </div>
        <CompanyProfileActions projectId={projectId} profileId={profile?.id} />
      </header>

      <section className="grid-3">
        <Card><span className="metric-label">Version</span><strong className="metric-value">{profile ? `v${profile.version}` : '—'}</strong><Pill tone={profile?.isApproved ? 'green' : 'amber'}>{profile?.isApproved ? 'Approved' : 'Pending'}</Pill></Card>
        <Card><span className="metric-label">Source</span><strong className="metric-value">API</strong><p>Loaded from project company profile endpoint.</p></Card>
        <Card><span className="metric-label">Research readiness</span><strong className="metric-value">{profile?.isApproved ? 'Ready' : 'Blocked'}</strong><p>Research unlocks after approval.</p></Card>
      </section>

      <section className="card section-gap">
        <div className="pill-row">
          <Pill tone="green">Live API</Pill>
          <Pill tone={profileQuery.isError ? 'amber' : 'green'}>{profileQuery.isError ? 'API unavailable' : 'Ready'}</Pill>
        </div>
        <h2 className="section-gap">Editable company context</h2>
        {profileBlocks.length ? (
          <div className="profile-list section-gap">
            {profileBlocks.map(([title, value]) => (
              <div key={String(title)} className="profile-block">
                <h3>{title}</h3>
                <p>{formatValue(value)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="section-gap">No company profile is available yet. Complete onboarding and discovery first.</p>
        )}
      </section>
    </div>
  );
}