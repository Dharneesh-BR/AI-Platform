'use client';

import { useState } from 'react';
import { Card, MetricCard, Pill } from '../../../components/platform/app-shell';
import { useAuth } from '../../../lib/auth/session';
import { useCreateResearchPlan, useResearchPlans } from '../../../lib/api/query-hooks';

interface ResearchWorkspaceProps {
  projectId: string;
}

export function ResearchWorkspace({ projectId }: ResearchWorkspaceProps) {
  const { session } = useAuth();
  const context = { accessToken: session.accessToken };
  const plansQuery = useResearchPlans(projectId, context);
  const createPlan = useCreateResearchPlan(projectId, context);
  const [message, setMessage] = useState('Create a research plan after API auth is enabled.');
  const plans = plansQuery.data ?? [];

  async function createDefaultPlan() {
    if (!session.accessToken) {
      setMessage('API token is required before creating a database record.');
      return;
    }

    await createPlan.mutateAsync({
      title: 'Stakeholder AI opportunity analysis',
      question: 'Which AI opportunities should the stakeholder team prioritize in the next sprint?',
      objectives: ['Prioritize high-impact workflows', 'Identify risks', 'Prepare report-ready recommendations'],
    });
    setMessage('Created research plan from live API.');
  }

  return (
    <div>
      <header className="topbar">
        <div>
          <span className="eyebrow">Research Pipeline</span>
          <h1>Plan evidence-backed strategic analysis.</h1>
          <p>Research consumes approved company profile, discovery sources, documents, and future integrations.</p>
        </div>
        <button className="button button-primary" onClick={() => void createDefaultPlan()} disabled={createPlan.isPending}>
          Create research plan
        </button>
      </header>
      <section className="grid-3">
        <MetricCard label="Plans" value={String(plans.length)} detail="Loaded from backend." />
        <MetricCard label="Frameworks" value="8" detail="SWOT, PESTLE, Porter, GTM, pricing, risks." />
        <MetricCard label="Validation" value="Required" detail="Facts are validated before reports." />
      </section>
      <section className="card section-gap">
        <div className="pill-row">
          <Pill tone="green">Live API</Pill>
          <Pill tone={plansQuery.isError ? 'amber' : 'green'}>{plansQuery.isError ? 'API unavailable' : 'Ready'}</Pill>
        </div>
        <h2 className="section-gap">Research plans</h2>
        <div className="timeline">
          {plans.map((plan) => (
            <div className="timeline-item" key={plan.id}>
              <div>
                <strong>{plan.title}</strong>
                <p>{plan.question}</p>
              </div>
              <Pill tone={plan.status === 'PLANNED' ? 'green' : 'slate'}>{plan.status}</Pill>
            </div>
          ))}
        </div>
        {!plansQuery.isLoading && !plansQuery.isError && plans.length === 0 ? (
          <p className="section-gap">No research plans exist yet. Create the first plan from this page.</p>
        ) : null}
        <p className="section-gap">{message}</p>
      </section>
      <Card className="section-gap">
        <h2>Pipeline</h2>
        <div className="flow-map">
          <Pill>Topic extraction</Pill><Pill>Research planning</Pill><Pill>Knowledge search</Pill><Pill>AI analysis</Pill><Pill>Fact validation</Pill><Pill>Report writing</Pill>
        </div>
      </Card>
    </div>
  );
}
