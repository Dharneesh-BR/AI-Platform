import Link from 'next/link';
import { Card } from '../../../../../components/platform/app-shell';
import { OnboardingForm } from '../../../../../features/onboarding/components/onboarding-form';

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
          <OnboardingForm projectId={projectId} />
        </Card>
      </section>
    </div>
  );
}
