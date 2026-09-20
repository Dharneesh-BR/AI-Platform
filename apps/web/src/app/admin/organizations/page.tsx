import { LiveOrganizationsList } from '../../../features/organizations/components/live-organizations-list';

export default function AdminOrganizationsPage() {
  return (
    <main className="workspace">
      <section className="card">
        <span className="eyebrow">Platform</span>
        <h1>Organizations</h1>
        <p>Platform-level tenant visibility loaded from the live organization API.</p>
        <LiveOrganizationsList />
      </section>
    </main>
  );
}
