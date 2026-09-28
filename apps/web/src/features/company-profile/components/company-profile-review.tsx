'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Card, MetricCard, Pill } from '../../../components/platform/app-shell';
import { useCompanyProfile, useProject } from '../../../lib/api/query-hooks';
import type { UpdateCompanyProfilePayload } from '../../../lib/api/onboarding';
import { useAuth } from '../../../lib/auth/session';
import { ChatWorkspace } from '../../conversations/components/chat-workspace';
import { CompanyProfileActions } from './company-profile-actions';

interface CompanyProfileReviewProps {
  projectId: string;
}

function isPlaceholderValue(value: string): boolean {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[{}[\]"'`]/g, '')
    .replace(/\s+/g, ' ');

  return [
    'string',
    'strings',
    'string, string',
    'array of strings',
    'example',
    'sample',
    'placeholder',
    'n/a',
    'na',
    'none',
    'null',
    'undefined',
    'not provided',
  ].includes(normalized);
}

function displayList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()) && !isPlaceholderValue(item))
    : [];
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    const values = displayList(value);
    return values.length ? values.join(', ') : 'Not provided';
  }

  if (typeof value === 'string' && value.trim() && !isPlaceholderValue(value)) {
    return value;
  }

  return 'Not provided';
}

function summaryText(summaries: Record<string, unknown> | null | undefined, key: string): string | null {
  const value = summaries?.[key];
  return typeof value === 'string' && value.trim() && !isPlaceholderValue(value) ? value : null;
}

function summaryList(summaries: Record<string, unknown> | null | undefined, key: string): string[] {
  return displayList(summaries?.[key]);
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

interface ReportCardFormState {
  executiveSummary: string;
  aiReadiness: string;
  futureDirection: string;
  industry: string;
  opportunityAreas: string;
  targetCustomers: string;
  operationalGaps: string;
  recommendedPositioning: string;
  recommendedRoadmap: string;
}

function listToText(value: string[]): string {
  return value.join('\n');
}

function textToList(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter((item) => item && !isPlaceholderValue(item));
}

function buildFormState(profile: NonNullable<ReturnType<typeof useCompanyProfile>['data']>): ReportCardFormState {
  const products = displayList(profile.products);
  const services = displayList(profile.services);
  return {
    executiveSummary: summaryText(profile.summaries, 'executiveSummary') ?? profile.mission ?? '',
    aiReadiness: summaryText(profile.summaries, 'aiReadiness') ?? '',
    futureDirection: profile.vision ?? '',
    industry: profile.industry ?? '',
    opportunityAreas: listToText([...products, ...services]),
    targetCustomers: listToText(displayList(profile.targetCustomers)),
    operationalGaps: listToText(displayList(profile.painPoints)),
    recommendedPositioning: profile.uniqueSellingProposition ?? '',
    recommendedRoadmap: listToText(summaryList(profile.summaries, 'recommendedRoadmap')),
  };
}

export function CompanyProfileReview({ projectId }: CompanyProfileReviewProps) {
  const { session } = useAuth();
  const profileQuery = useCompanyProfile(projectId, {
    accessToken: session.accessToken,
  });
  const projectQuery = useProject(projectId, {
    accessToken: session.accessToken,
  });
  const profile = profileQuery.data;
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ReportCardFormState | null>(null);
  const isAiReady = projectQuery.data?.lifecycleState === 'AI_READY';
  const products = displayList(profile?.products);
  const services = displayList(profile?.services);
  const targetCustomers = displayList(profile?.targetCustomers);
  const painPoints = displayList(profile?.painPoints);
  const opportunityCount = products.length + services.length;
  const riskCount = painPoints.length;
  const executiveSummary = summaryText(profile?.summaries, 'executiveSummary');
  const aiReadiness = summaryText(profile?.summaries, 'aiReadiness');
  const recommendedRoadmap = summaryList(profile?.summaries, 'recommendedRoadmap');
  const pages = crawledPages(profile?.summaries);

  useEffect(() => {
    if (profile && !isEditing) {
      setForm(buildFormState(profile));
    }
  }, [profile, isEditing]);

  const profileBlocks = useMemo(
    () => profile
      ? [
          ['Executive Summary', isEditing ? form?.executiveSummary : executiveSummary ?? profile.mission],
          ['AI Readiness', isEditing ? form?.aiReadiness : aiReadiness],
          ['Future Direction', isEditing ? form?.futureDirection : profile.vision],
          ['Industry', isEditing ? form?.industry : profile.industry],
          ['AI Opportunity Areas', isEditing ? textToList(form?.opportunityAreas ?? '') : [...products, ...services]],
          ['Target Users / Customers', isEditing ? textToList(form?.targetCustomers ?? '') : targetCustomers],
          ['Operational Gaps', isEditing ? textToList(form?.operationalGaps ?? '') : painPoints],
          ['Recommended Positioning', isEditing ? form?.recommendedPositioning : profile.uniqueSellingProposition],
          ['Recommended Roadmap', isEditing ? textToList(form?.recommendedRoadmap ?? '') : recommendedRoadmap],
        ]
      : [],
    [
      aiReadiness,
      executiveSummary,
      form,
      isEditing,
      painPoints,
      products,
      profile,
      recommendedRoadmap,
      services,
      targetCustomers,
    ],
  );

  const editPayload = profile && form
    ? {
        mission: form.executiveSummary || null,
        vision: form.futureDirection || null,
        industry: form.industry || null,
        targetCustomers: textToList(form.targetCustomers),
        products: textToList(form.opportunityAreas),
        services: [],
        painPoints: textToList(form.operationalGaps),
        uniqueSellingProposition: form.recommendedPositioning || null,
        summaries: {
          ...(profile.summaries ?? {}),
          executiveSummary: form.executiveSummary,
          aiReadiness: form.aiReadiness,
          recommendedRoadmap: textToList(form.recommendedRoadmap),
        },
      } satisfies UpdateCompanyProfilePayload
    : undefined;

  function updateField(field: keyof ReportCardFormState, value: string) {
    setForm((current) => current ? { ...current, [field]: value } : current);
  }

  function startEditing() {
    if (profile) {
      setForm(buildFormState(profile));
      setIsEditing(true);
    }
  }

  function cancelEditing() {
    if (profile) {
      setForm(buildFormState(profile));
    }
    setIsEditing(false);
  }

  return (
    <div>
      <header className="topbar">
        <div>
          <span className="eyebrow">AI Readiness Report</span>
          <h1>Your company report card is ready for review.</h1>
          <p>Approve this AI-generated draft before it becomes trusted context for chat, workforce agents, research, and reports.</p>
        </div>
        <div className="topbar-actions">
          {isAiReady ? <a className="button button-primary" href="#ai-chat">Open AI chat</a> : null}
          {isAiReady ? <Link className="button button-muted" href={`/projects/${projectId}/reports`}>Open reports</Link> : null}
          {isAiReady ? <Link className="button button-muted" href={`/projects/${projectId}/knowledge`}>Knowledge</Link> : null}
          <Link className="button button-muted" href={`/projects/${projectId}`}>Project workspace</Link>
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
            <Pill tone={isAiReady ? 'green' : 'amber'}>{isAiReady ? 'AI unlocked' : 'Approval required'}</Pill>
          </div>
          <h2 className="section-gap">Executive report card</h2>
          {isEditing && form ? (
            <div className="profile-list section-gap">
              <ReportCardTextarea label="Executive Summary" value={form.executiveSummary} onChange={(value) => updateField('executiveSummary', value)} />
              <ReportCardTextarea label="AI Readiness" value={form.aiReadiness} onChange={(value) => updateField('aiReadiness', value)} />
              <ReportCardTextarea label="Future Direction" value={form.futureDirection} onChange={(value) => updateField('futureDirection', value)} />
              <ReportCardTextarea label="Industry" value={form.industry} onChange={(value) => updateField('industry', value)} compact />
              <ReportCardTextarea label="AI Opportunity Areas" value={form.opportunityAreas} onChange={(value) => updateField('opportunityAreas', value)} hint="One item per line." />
              <ReportCardTextarea label="Target Users / Customers" value={form.targetCustomers} onChange={(value) => updateField('targetCustomers', value)} hint="One item per line." />
              <ReportCardTextarea label="Operational Gaps" value={form.operationalGaps} onChange={(value) => updateField('operationalGaps', value)} hint="One item per line." />
              <ReportCardTextarea label="Recommended Positioning" value={form.recommendedPositioning} onChange={(value) => updateField('recommendedPositioning', value)} />
              <ReportCardTextarea label="Recommended Roadmap" value={form.recommendedRoadmap} onChange={(value) => updateField('recommendedRoadmap', value)} hint="One item per line." />
            </div>
          ) : profileBlocks.length ? (
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
          <div className="section-gap">
            <CompanyProfileActions
              projectId={projectId}
              profileId={profile?.id}
              draft={editPayload}
              isEditing={isEditing}
              onEdit={startEditing}
              onCancel={cancelEditing}
              onSaved={() => setIsEditing(false)}
            />
          </div>
        </div>
        {isAiReady ? (
          <ChatWorkspace projectId={projectId} embedded />
        ) : (
          <Card>
            <Pill tone="amber">Locked until approval</Pill>
            <h2 className="section-gap">Approve the company profile</h2>
            <p>
              Review the generated company report, save any edits, then approve it. Once approved,
              Magnafic AI will use it as trusted project context.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}

function ReportCardTextarea({
  label,
  value,
  onChange,
  compact = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
  hint?: string;
}) {
  return (
    <label className="profile-block field">
      <span>{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={compact ? 2 : 5}
      />
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}
