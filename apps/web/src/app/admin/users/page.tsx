import { AdminUsersPanel } from '../../../features/platform-data/components/admin-users-panel';

export default function AdminUsersPage() {
  return <main className="workspace"><section className="card"><span className="eyebrow">Platform</span><h1>Users</h1><p>Review signed-in platform users and account status.</p><AdminUsersPanel /></section></main>;
}
