'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useApproveCompanyProfile, useUpdateCompanyProfile } from '../../../lib/api/query-hooks';
import type { UpdateCompanyProfilePayload } from '../../../lib/api/onboarding';
import { useAuth } from '../../../lib/auth/session';

interface CompanyProfileActionsProps {
  projectId: string;
  profileId?: string;
  draft?: UpdateCompanyProfilePayload;
  isEditing?: boolean;
  onEdit?: () => void;
  onCancel?: () => void;
  onSaved?: () => void;
}

export function CompanyProfileActions({
  projectId,
  profileId,
  draft,
  isEditing = false,
  onEdit,
  onCancel,
  onSaved,
}: CompanyProfileActionsProps) {
  const router = useRouter();
  const { session } = useAuth();
  const context = { accessToken: session.accessToken };
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

    if (!draft) {
      setMessage('Open edit mode before saving profile edits.');
      return;
    }

    await updateProfile.mutateAsync(draft);
    setMessage('Profile edits saved.');
    onSaved?.();
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
      {isEditing ? (
        <>
          <button className="button button-primary" onClick={saveEdits} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Saving...' : 'Save edits'}
          </button>
          <button className="button button-muted" type="button" onClick={onCancel} disabled={updateProfile.isPending}>Cancel edits</button>
        </>
      ) : (
        <button className="button button-muted" type="button" onClick={onEdit} disabled={!profileId}>Edit report card</button>
      )}
      <button className="button button-primary" onClick={approve} disabled={approveProfile.isPending || isEditing}>
        {approveProfile.isPending ? 'Approving...' : 'Approve profile'}
      </button>
      <p>{message}</p>
    </div>
  );
}
