'use client';

import { MetricCard, Pill } from '../../../components/platform/app-shell';
import { useCompanyProfile } from '../../../lib/api/query-hooks';
import { useAuth } from '../../../lib/auth/session';
import { ChatWorkspace } from '../../conversations/components/chat-workspace';

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

function summaryText(summaries: Record<string, unknown> | null | undefined, key: string): string | null {
  const value = summaries?.[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function summaryList(summaries: Record<string, unknown> | null | undefined, key: string): string[] {
  const value = summaries?.[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())) : [];
}

function crawledPages(summaries: Record<string, unknown> | null | undefined): Array<{ url: string; title?: string | null }> {
  const value = summaries?.crawledPages;
  if (!Array.isArray(value)) {
    return [];
  }

  const pages: Array<{ url: string; title?: string | null }> = [];

  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const record = item as Record<string, unknown>;
    if (typeof record.url === 'string') {
      pages.push({ url: record.url, title: typeof record.title === 'string' ? record.title : null });
    }
  }

  return pages;
}

export function CompanyProfileReview({ projectId }: CompanyProfileReviewProps) {
  const { session } = useAuth();
  const profileQuery = useCompanyProfile(projectId, {
    accessToken: session.accessToken,
    organizationId: session.organizationId,
  });
  const profile = profileQuery.data;
  const opportunityCount = (profile?.products?.length ?? 0) + (profile?.services?.length ?? 0);
  const riskCount = profile?.painPoints?.length ?? 0;
  const executiveSummary = summaryText(profile?.summaries, 'executiveSummary');
  const aiReadiness = summaryText(profile?.summaries, 'aiReadiness');
  const recommendedRoadmap = summaryList(profile?.summaries, 'recommendedRoadmap');
  const pages = crawledPages(profile?.summaries);

  const profileBlocks = profile
    ? [
        ['Executive Summary', executiveSummary ?? profile.mission],
        ['AI Readiness', aiReadiness],
        ['Future Direction', profile.vision],
        ['Industry', profile.industry],
        ['AI Opportunity Areas', [...profile.products, ...profile.services]],
        ['Target Users / Customers', profile.targetCustomers],
        ['Operational Gaps', profile.painPoints],
        ['Recommended Positioning', profile.uniqueSellingProposition],
        ['Recommended Roadmap', recommendedRoadmap],
      ]
    : [];

  return (
    <div>
      <header className="topbar">
        <div>
          <span className="eyebrow">AI Readiness Report</span>
          <h1>Your company report card is ready. Now ask Magnafic AI what to do next.</h1>
          <p>After onboarding, Magnafic AI generates a company-aware report card and opens an AI chat grounded in that context.</p>
        </div>
        <div className="topbar-actions">
          <a className="button button-primary" href="#ai-chat">Open AI chat</a>
        </div>
      </header>

      <section className="grid-3">
        <MetricCard label="AI readiness" value={profile ? 'Ready' : '—'} detail="Generated from onboarding and discovery context." />
        <MetricCard label="Opportunity areas" value={String(opportunityCount)} detail="Products, services, and workflows AI can improve." />
        <MetricCard label="Priority gaps" value={String(riskCount)} detail="Challenges the AI copilot should help solve first." />
      </section>

      <section id="ai-chat" className="grid-2 section-gap">
        <div className="card hero-card">
          <div className="pill-row">
            <Pill tone="green">Generated after onboarding</Pill>
            <Pill tone={profileQuery.isError ? 'amber' : 'green'}>{profileQuery.isError ? 'API unavailable' : 'Report ready'}</Pill>
            <Pill tone="blue">Chat unlocked</Pill>
          </div>
          <h2 className="section-gap">Executive report card</h2>
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
            <p className="section-gap">No report is available yet. Complete onboarding to generate the company report card.</p>
          )}
          {pages.length ? (
            <div className="profile-block section-gap">
              <h3>Public pages reviewed</h3>
              <p>{pages.slice(0, 5).map((page) => page.title || page.url).join(', ')}</p>
            </div>
          ) : null}
        </div>
        <ChatWorkspace projectId={projectId} embedded />
      </section>
    </div>
  );
}
