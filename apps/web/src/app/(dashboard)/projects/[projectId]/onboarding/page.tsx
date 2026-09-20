import Link from 'next/link';
import { Card } from '../../../../../components/platform/app-shell';
import { OnboardingForm } from '../../../../../features/onboarding/components/onboarding-form';

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
          <h1>Add the basics and start discovery.</h1>
          <p>For the MVP, only company name, website, industry, and size are required. You can add deeper context later in Knowledge.</p>
        </div>
        <div className="topbar-actions">
          <Link className="button button-muted" href={`/projects/${projectId}`}>Back to project</Link>
          <Link className="button button-primary" href={`/projects/${projectId}/discovery`}>View discovery</Link>
        </div>
      </header>

      <Card>
        <OnboardingForm projectId={projectId} />
      </Card>
    </div>
  );
}
