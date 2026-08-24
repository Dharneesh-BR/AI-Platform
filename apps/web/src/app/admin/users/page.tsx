import { AdminUsersPanel } from '../../../features/platform-data/components/admin-users-panel';

export default function AdminUsersPage() {
  return <main className="workspace"><section className="card"><span className="eyebrow">Admin</span><h1>Users</h1><p>Manage global user access and investigate account status.</p><AdminUsersPanel /></section></main>;
}
