'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCompleteOnboarding, useUpsertProjectProfile } from '../../../lib/api/query-hooks';
import { useAuth } from '../../../lib/auth/session';

interface OnboardingActionsProps {
  projectId: string;
}

export function OnboardingActions({ projectId }: OnboardingActionsProps) {
  const router = useRouter();
  const { session } = useAuth();
  const context = { accessToken: session.accessToken, organizationId: session.organizationId };
  const upsertProfile = useUpsertProjectProfile(projectId, context);
  const completeOnboarding = useCompleteOnboarding(projectId, context);
  const [message, setMessage] = useState('Autosave-ready. Complete onboarding to enqueue discovery.');

  async function saveDraft() {
    if (!context.accessToken) {
      setMessage('API session required before saving onboarding.');
      return;
    }

    await upsertProfile.mutateAsync({
      companyName: 'Magnafic AI',
      websiteUrl: 'https://magnafic.ai',
      industry: 'AI Consulting',
      companySize: '11-50',
      businessModel: 'B2B Services + SaaS',
      targetMarket: 'Mid-market operators and consulting teams',
      businessGoals: ['Increase research throughput', 'Standardize consulting deliverables'],
      primaryChallenges: ['Fragmented knowledge', 'Slow manual research'],
      onboardingStep: 'company-basics',
    });
    setMessage('Draft saved to project profile.');
  }

  async function complete() {
    if (!context.accessToken) {
      setMessage('API session required before completing onboarding.');
      return;
    }

    await saveDraft();
    await completeOnboarding.mutateAsync();
    router.push(`/projects/${projectId}/discovery`);
  }

  return (
    <div className="actions section-gap topbar-actions">
      <button className="button button-ghost">Previous</button>
      <button className="button button-muted" onClick={saveDraft} disabled={upsertProfile.isPending}>Save and continue later</button>
      <button className="button button-primary" onClick={complete} disabled={completeOnboarding.isPending}>Complete onboarding -&gt;</button>
      <p>{message}</p>
    </div>
  );
}
