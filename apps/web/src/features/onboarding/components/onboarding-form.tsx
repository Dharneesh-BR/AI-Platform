'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useMemo, useState } from 'react';
import { Pill } from '../../../components/platform/app-shell';
import { useCompleteOnboarding, useUpsertProjectProfile } from '../../../lib/api/query-hooks';
import type { UpsertProjectProfilePayload } from '../../../lib/api/onboarding';
import { useAuth } from '../../../lib/auth/session';

interface OnboardingFormProps {
  projectId: string;
}

const initialForm = {
  companyName: 'Svasam Veda Life Sciences',
  websiteUrl: 'https://svasamveda.com',
  industry: 'Life Sciences / Healthcare',
  companySize: '51-200',
  businessModel: 'B2B and B2C healthcare products and services',
  targetMarket: 'Healthcare providers, wellness clinics, pharmacies, distributors, researchers, and health-conscious consumers.',
  businessGoals:
    'Improve operational efficiency\nIncrease customer engagement\nStrengthen research and knowledge management\nGenerate faster business insights using AI',
  primaryChallenges:
    'Manual document handling\nScattered company knowledge\nSlow report generation\nRepetitive customer and support queries',
  competitors: 'Healthcare AI platforms\nWellness technology providers\nLife sciences analytics tools',
};

function toList(value: string): string[] {
  return value
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function OnboardingForm({ projectId }: OnboardingFormProps) {
  const router = useRouter();
  const { session } = useAuth();
  const context = { accessToken: session.accessToken, organizationId: session.organizationId };
  const upsertProfile = useUpsertProjectProfile(projectId, context);
  const completeOnboarding = useCompleteOnboarding(projectId, context);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('Ready to save company basics and continue.');

  const payload = useMemo<UpsertProjectProfilePayload>(
    () => ({
      companyName: form.companyName.trim(),
      websiteUrl: form.websiteUrl.trim() || null,
      industry: form.industry.trim() || null,
      companySize: form.companySize || null,
      businessModel: form.businessModel.trim() || null,
      targetMarket: form.targetMarket.trim() || null,
      businessGoals: toList(form.businessGoals),
      primaryChallenges: toList(form.primaryChallenges),
      competitors: toList(form.competitors),
      onboardingStep: 'company-basics-complete',
    }),
    [form],
  );

  const canSubmit = Boolean(context.accessToken && context.organizationId && payload.companyName.length >= 2);

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
      setMessage('Company basics saved. You can complete onboarding now.');
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
      await completeOnboarding.mutateAsync();
      router.push(`/projects/${projectId}/company-profile`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to complete onboarding. Please retry.');
    }
  }

  return (
    <form onSubmit={complete}>
      <div className="pill-row">
        <Pill tone="green">API-backed</Pill>
        <Pill>Tenant scoped</Pill>
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
        <div className="field">
          <label>Business Model</label>
          <input value={form.businessModel} onChange={(event) => updateField('businessModel', event.target.value)} />
        </div>
        <div className="field">
          <label>Target Market</label>
          <input value={form.targetMarket} onChange={(event) => updateField('targetMarket', event.target.value)} />
        </div>
      </div>

      <div className="field section-gap">
        <label>Business Goals</label>
        <textarea value={form.businessGoals} onChange={(event) => updateField('businessGoals', event.target.value)} />
      </div>
      <div className="field section-gap">
        <label>Primary Challenges</label>
        <textarea
          value={form.primaryChallenges}
          onChange={(event) => updateField('primaryChallenges', event.target.value)}
        />
      </div>
      <div className="field section-gap">
        <label>Competitive Context</label>
        <textarea value={form.competitors} onChange={(event) => updateField('competitors', event.target.value)} />
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
          Complete onboarding -&gt;
        </button>
        <p>{message}</p>
      </div>
    </form>
  );
}
