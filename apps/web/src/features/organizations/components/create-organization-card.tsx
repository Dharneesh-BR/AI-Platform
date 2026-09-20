'use client';

import { useState } from 'react';
import { useCreateOrganization } from '../../../lib/api/query-hooks';
import { Card, Pill } from '../../../components/platform/app-shell';
import { useAuth } from '../../../lib/auth/session';

export function CreateOrganizationCard() {
  const { session } = useAuth();
  const context = { accessToken: session.accessToken, organizationId: session.organizationId };
  const createOrganization = useCreateOrganization(context);
  const [name, setName] = useState('Magnafic AI');
  const [slug, setSlug] = useState('magnafic-consulting');
  const [message, setMessage] = useState('API session required before submitting to the backend.');

  async function submit() {
    if (!context.accessToken) {
      setMessage('API session required. Sign in before creating an organization.');
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
        <Pill tone={context.accessToken ? 'green' : 'slate'}>
          {context.accessToken ? 'Signed in' : 'Sign in required'}
        </Pill>
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
