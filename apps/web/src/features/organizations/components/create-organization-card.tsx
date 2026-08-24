'use client';

import { useState } from 'react';
import { useCreateOrganization } from '../../../lib/api/query-hooks';
import { Card, Pill } from '../../../components/platform/app-shell';
import { canCreateOrganization, useAuth } from '../../../lib/auth/session';

export function CreateOrganizationCard() {
  const { session } = useAuth();
  const context = { accessToken: session.accessToken, organizationId: session.organizationId };
  const createOrganization = useCreateOrganization(context);
  const [name, setName] = useState('Magnafic AI');
  const [slug, setSlug] = useState('magnafic-consulting');
  const [message, setMessage] = useState('API session required before submitting to the backend.');

  async function submit() {
    if (!canCreateOrganization(session.user.role)) {
      setMessage('Only Super Admin can create organizations. Switch login to Super Admin for this action.');
      return;
    }

    if (!context.accessToken) {
      setMessage('Ready for API: login/JWT wiring is required before live submission.');
      return;
    }

    const organization = await createOrganization.mutateAsync({ name, slug });
    setMessage(`Created organization: ${organization.name}`);
  }

  return (
    <Card>
      <div className="pill-row">
        <Pill>Live-ready form</Pill>
        <Pill tone={context.accessToken ? 'green' : 'amber'}>{context.accessToken ? 'API connected' : 'API required'}</Pill>
        <Pill tone={canCreateOrganization(session.user.role) ? 'green' : 'slate'}>{session.user.displayName}</Pill>
      </div>
      <h2 className="section-gap">Create organization</h2>
      <div className="form-grid">
        <div className="field"><label>Name</label><input value={name} onChange={(event) => setName(event.target.value)} /></div>
        <div className="field"><label>Slug</label><input value={slug} onChange={(event) => setSlug(event.target.value)} /></div>
      </div>
      <div className="actions section-gap topbar-actions">
        <button className="button button-primary" onClick={submit} disabled={createOrganization.isPending}>Create organization</button>
        <p>{message}</p>
      </div>
    </Card>
  );
}
