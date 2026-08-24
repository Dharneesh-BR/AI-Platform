import Link from 'next/link';
import { LiveProjectsSection } from '../../../features/projects/components/live-projects-section';

export default function ProjectsPage() {
  return (
    <div>
      <header className="topbar">
        <div>
          <span className="eyebrow">Projects</span>
          <h1>Every engagement moves through a governed AI-readiness lifecycle.</h1>
          <p>Projects collect onboarding data, run discovery, approve company context, then unlock research and AI workflows.</p>
        </div>
        <Link className="button button-primary" href="/projects">Create project below</Link>
      </header>
      <LiveProjectsSection />
    </div>
  );
}
