import { AdminHealthPanel } from '../../features/platform-data/components/admin-health-panel';

export default function AdminPage() {
  return (
    <main className="workspace">
      <header className="topbar">
        <div>
          <span className="eyebrow">Platform</span>
          <h1>Platform operations cockpit.</h1>
          <p>Monitor tenants, users, model gateway configuration, audit events, and system health from live APIs.</p>
        </div>
      </header>
      <AdminHealthPanel />
    </main>
  );
}
