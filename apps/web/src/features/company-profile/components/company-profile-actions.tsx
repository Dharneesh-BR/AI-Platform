'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useApproveCompanyProfile, useUpdateCompanyProfile } from '../../../lib/api/query-hooks';
import { useAuth } from '../../../lib/auth/session';

interface CompanyProfileActionsProps {
  projectId: string;
  profileId?: string;
}

export function CompanyProfileActions({ projectId, profileId }: CompanyProfileActionsProps) {
  const router = useRouter();
  const { session } = useAuth();
  const context = { accessToken: session.accessToken, organizationId: session.organizationId };
  const updateProfile = useUpdateCompanyProfile(projectId, profileId ?? '', context);
  const approveProfile = useApproveCompanyProfile(projectId, profileId ?? '', context);
  const [message, setMessage] = useState('Review generated context before approval.');

  async function saveEdits() {
    if (!context.accessToken) {
      setMessage('API session required before saving profile edits.');
      return;
    }

    if (!profileId) {
      setMessage('Profile must be loaded from the API before saving edits.');
      return;
    }

    await updateProfile.mutateAsync({
      mission: 'Help businesses turn complex market questions into clear AI-assisted strategy.',
      industry: 'AI Consulting',
      products: ['AI strategy workshops', 'Market research', 'Competitor analysis'],
      services: ['Research sprints', 'GTM strategy', 'Business planning'],
    });
    setMessage('Profile edits saved.');
  }

  async function approve() {
    if (!context.accessToken) {
      setMessage('API session required before approving profile.');
      return;
    }

    if (!profileId) {
      setMessage('Profile must be loaded from the API before approval.');
      return;
    }

    await approveProfile.mutateAsync();
    router.push(`/projects/${projectId}`);
  }

  return (
    <div className="topbar-actions">
      <button className="button button-muted" onClick={saveEdits} disabled={updateProfile.isPending}>Save edits</button>
      <button className="button button-primary" onClick={approve} disabled={approveProfile.isPending}>Approve profile</button>
      <p>{message}</p>
    </div>
  );
}
