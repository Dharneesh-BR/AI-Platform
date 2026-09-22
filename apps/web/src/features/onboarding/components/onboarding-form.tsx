'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Pill } from '../../../components/platform/app-shell';
import { useCompleteOnboarding, useProject, useProjectProfile, useUpsertProjectProfile } from '../../../lib/api/query-hooks';
import type { UpsertProjectProfilePayload } from '../../../lib/api/onboarding';
import { useAuth } from '../../../lib/auth/session';

interface OnboardingFormProps {
  projectId: string;
}

const initialForm = {
  companyName: '',
  websiteUrl: '',
  industry: '',
  companySize: '',
  businessModel: '',
  targetMarket: '',
  businessGoals: '',
  primaryChallenges: '',
  competitors: '',
};

function toList(value: string): string[] {
  return value
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function withFallbackList(value: string, fallback: string[]): string[] {
  const parsed = toList(value);
  return parsed.length ? parsed : fallback;
}

export function OnboardingForm({ projectId }: OnboardingFormProps) {
  const router = useRouter();
  const { session } = useAuth();
  const context = { accessToken: session.accessToken };
  const projectQuery = useProject(projectId, context);
  const projectProfileQuery = useProjectProfile(projectId, context);
  const upsertProfile = useUpsertProjectProfile(projectId, context);
  const completeOnboarding = useCompleteOnboarding(projectId, context);
  const [form, setForm] = useState(initialForm);
  const [hasHydratedForm, setHasHydratedForm] = useState(false);
  const [message, setMessage] = useState('Ready to save company basics and continue.');

  useEffect(() => {
    if (hasHydratedForm) {
      return;
    }

    const profile = projectProfileQuery.data;
    const project = projectQuery.data;

    if (profile) {
      setForm({
        companyName: profile.companyName ?? project?.name ?? '',
        websiteUrl: profile.websiteUrl ?? '',
        industry: profile.industry ?? '',
        companySize: profile.companySize ?? '',
        businessModel: profile.businessModel ?? '',
        targetMarket: profile.targetMarket ?? '',
        businessGoals: profile.businessGoals?.join('\n') ?? '',
        primaryChallenges: profile.primaryChallenges?.join('\n') ?? '',
        competitors: profile.competitors?.join('\n') ?? '',
      });
      setHasHydratedForm(true);
      return;
    }

    if (project && !form.companyName) {
      setForm((current) => ({
        ...current,
        companyName: project.name,
        businessGoals: current.businessGoals || 'Clarify positioning\nUnderstand customers\nPrioritize growth opportunities',
        primaryChallenges: current.primaryChallenges || 'Scattered business context\nManual research\nUnclear next priorities',
      }));
      setHasHydratedForm(true);
    }
  }, [form.companyName, hasHydratedForm, projectProfileQuery.data, projectQuery.data]);

  const payload = useMemo<UpsertProjectProfilePayload>(
    () => ({
      companyName: form.companyName.trim(),
      websiteUrl: form.websiteUrl.trim() || null,
      industry: form.industry.trim() || null,
      companySize: form.companySize || null,
      businessModel: form.businessModel.trim() || 'Business workspace for consulting, research, and growth planning',
      targetMarket: form.targetMarket.trim() || null,
      businessGoals: withFallbackList(form.businessGoals, [
        'Clarify positioning',
        'Understand customers',
        'Prioritize growth opportunities',
      ]),
      primaryChallenges: withFallbackList(form.primaryChallenges, [
        'Scattered business context',
        'Manual research',
        'Unclear next priorities',
      ]),
      competitors: toList(form.competitors),
      onboardingStep: 'company-basics-complete',
    }),
    [form],
  );

  const canSubmit = Boolean(context.accessToken && payload.companyName.length >= 2);

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveDraft() {
    if (!canSubmit) {
      setMessage('Company name and API session are required before saving.');
      return false;
    }

    try {
      await upsertProfile.mutateAsync(payload);
      setMessage('Basics saved.');
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save onboarding. Please retry.');
      return false;
    }
  }

  async function complete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await saveDraft();

    if (!saved) {
      return;
    }

    try {
      setMessage('Starting discovery...');
      await completeOnboarding.mutateAsync();
      router.push(`/projects/${projectId}/discovery`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to complete onboarding. Please retry.');
    }
  }

  return (
    <form onSubmit={complete}>
      <div className="pill-row">
        <Pill tone="green">API-backed</Pill>
        <Pill>Project specific</Pill>
        <Pill tone="slate">Complete basics</Pill>
      </div>

      <div className="form-grid section-gap">
        <div className="field">
          <label>Company Name</label>
          <input value={form.companyName} onChange={(event) => updateField('companyName', event.target.value)} />
        </div>
        <div className="field">
          <label>Website URL</label>
          <input value={form.websiteUrl} onChange={(event) => updateField('websiteUrl', event.target.value)} />
        </div>
        <div className="field">
          <label>Industry</label>
          <input value={form.industry} onChange={(event) => updateField('industry', event.target.value)} />
        </div>
        <div className="field">
          <label>Company Size</label>
          <select value={form.companySize} onChange={(event) => updateField('companySize', event.target.value)}>
            <option value="" disabled>Select size</option>
            <option>1-10</option>
            <option>11-50</option>
            <option>51-200</option>
            <option>201-1000</option>
            <option>1000+</option>
          </select>
        </div>
      </div>

      <div className="actions section-gap topbar-actions">
        <button className="button button-ghost" type="button" onClick={() => router.push(`/projects/${projectId}`)}>
          Previous
        </button>
        <button
          className="button button-muted"
          type="button"
          onClick={saveDraft}
          disabled={upsertProfile.isPending || completeOnboarding.isPending}
        >
          Save and continue later
        </button>
        <button
          className="button button-primary"
          type="submit"
          disabled={!canSubmit || upsertProfile.isPending || completeOnboarding.isPending}
        >
          Start discovery
        </button>
        <p>{message}</p>
      </div>
    </form>
  );
}
