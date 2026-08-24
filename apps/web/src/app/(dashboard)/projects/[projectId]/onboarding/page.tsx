import Link from 'next/link';
import { Card, Pill } from '../../../../../components/platform/app-shell';
import { OnboardingActions } from '../../../../../features/onboarding/components/onboarding-actions';

const steps = [
  ['Company basics', 'Name, website, industry'],
  ['Business context', 'Size, model, market'],
  ['Strategic goals', 'Goals and challenges'],
  ['Competitive context', 'Known competitors'],
  ['Knowledge inputs', 'Documents and brand assets'],
];

interface ProjectOnboardingPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectOnboardingPage({ params }: ProjectOnboardingPageProps) {
  const { projectId } = await params;

  return (
    <div>
      <header className="topbar">
        <div>
          <span className="eyebrow">Project Onboarding</span>
          <h1>Capture the company context before research begins.</h1>
          <p>Each step saves to the project profile API so consultants and clients can pause and resume.</p>
        </div>
        <div className="topbar-actions">
          <Link className="button button-muted" href={`/projects/${projectId}`}>Back to project</Link>
          <Link className="button button-primary" href={`/projects/${projectId}/discovery`}>View discovery</Link>
        </div>
      </header>

      <section className="wizard-layout">
        <aside className="wizard-steps">
          {steps.map(([title, detail], index) => (
            <div key={title} className={`wizard-step ${index === 0 ? 'active' : ''}`}>
              {index + 1}. {title}
              <small>{detail}</small>
            </div>
          ))}
        </aside>

        <Card>
          <div className="pill-row">
            <Pill tone="green">API-backed</Pill>
            <Pill>Tenant scoped</Pill>
            <Pill tone="slate">Step 1 of 5</Pill>
          </div>
          <div className="form-grid section-gap">
            <div className="field"><label>Company Name</label><input placeholder="Company name" /></div>
            <div className="field"><label>Website URL</label><input placeholder="https://company.com" /></div>
            <div className="field"><label>Industry</label><input placeholder="Industry" /></div>
            <div className="field">
              <label>Company Size</label>
              <select defaultValue="">
                <option value="" disabled>Select size</option>
                <option>1-10</option><option>11-50</option><option>51-200</option><option>201-1000</option><option>1000+</option>
              </select>
            </div>
            <div className="field"><label>Business Model</label><input placeholder="Business model" /></div>
            <div className="field"><label>Target Market</label><input placeholder="Target market" /></div>
          </div>
          <div className="field section-gap"><label>Business Goals</label><textarea placeholder="Enter business goals" /></div>
          <div className="field section-gap"><label>Primary Challenges</label><textarea placeholder="Enter primary challenges" /></div>
          <OnboardingActions projectId={projectId} />
        </Card>
      </section>
    </div>
  );
}