import { AuditLogsPanel } from '../../../features/platform-data/components/audit-logs-panel';

export default function AuditLogsPage() {
  return <main className="workspace"><section className="card"><span className="eyebrow">Audit Logs</span><h1>Security and domain activity.</h1><p>Sensitive reads, writes, discovery runs, and admin actions are auditable.</p><AuditLogsPanel /></section></main>;
}
