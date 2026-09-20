import { AdminHealthPanel } from '../../../features/platform-data/components/admin-health-panel';

export default function SystemPage() {
  return (
    <main className="workspace">
      <header className="topbar">
        <div>
          <span className="eyebrow">System</span>
          <h1>Runtime health.</h1>
          <p>Operational checks for API, PostgreSQL, Firebase, Redis configuration, and LiteLLM.</p>
        </div>
      </header>
      <AdminHealthPanel />
    </main>
  );
}
