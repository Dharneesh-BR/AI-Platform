'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCreateProject } from '../../../lib/api/query-hooks';
import { Card, Pill } from '../../../components/platform/app-shell';
import { useAuth } from '../../../lib/auth/session';

export function CreateProjectCard() {
  const router = useRouter();
  const { session } = useAuth();
  const context = { accessToken: session.accessToken };
  const createProject = useCreateProject(context);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('New projects redirect to onboarding.');

  function slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async function submit() {
    if (!context.accessToken) {
      setMessage('API session required. Log in with live auth before creating a project.');
      return;
    }

    try {
      const normalizedName = name.trim();
      const normalizedSlug = slug.trim() || slugify(normalizedName);
      const project = await createProject.mutateAsync({
        name: normalizedName,
        slug: normalizedSlug,
        description: description.trim() || `${normalizedName} consulting workspace.`,
      });
      router.push(project.nextRoute);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Project creation failed. Try a unique slug.');
    }
  }

  return (
    <Card>
      <div className="pill-row">
        <Pill>Project creation</Pill>
        <Pill tone="green">Redirects to onboarding</Pill>
        <Pill tone={context.accessToken ? 'green' : 'slate'}>
          {context.accessToken ? 'Signed in' : 'Sign in required'}
        </Pill>
      </div>
      <h2 className="section-gap">Create project</h2>
      <div className="form-grid">
        <div className="field">
          <label>Name</label>
          <input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setSlug((current) => current || slugify(event.target.value));
            }}
            placeholder="Raptric Cycles"
          />
        </div>
        <div className="field"><label>Slug</label><input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="raptric-cycles" /></div>
      </div>
      <div className="field section-gap"><label>Description</label><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="AI-assisted consulting workspace for business strategy, research, and growth planning." /></div>
      <div className="actions section-gap topbar-actions">
        <button className="button button-primary" onClick={submit} disabled={createProject.isPending || name.trim().length < 2}>Create and onboard</button>
        <p>{message}</p>
      </div>
    </Card>
  );
}
