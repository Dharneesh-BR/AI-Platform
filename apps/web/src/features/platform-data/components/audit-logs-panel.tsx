'use client';

import { Pill } from '../../../components/platform/app-shell';
import { useAuditLogs } from '../../../lib/api/query-hooks';
import { useAuth } from '../../../lib/auth/session';

export function AuditLogsPanel() {
  const { session } = useAuth();
  const auditQuery = useAuditLogs({ accessToken: session.accessToken });
  const logs = auditQuery.data ?? [];

  return (
    <div className="timeline section-gap">
      {logs.map((log) => (
        <div className="timeline-item" key={log.id}>
          <div>
            <strong>{log.action}</strong>
            <p>{log.resourceType}{log.resourceId ? ` · ${log.resourceId}` : ''}</p>
          </div>
          <Pill tone="green">Live</Pill>
        </div>
      ))}
      {!auditQuery.isLoading && !auditQuery.isError && logs.length === 0 ? (
        <p>No audit logs were returned by the API.</p>
      ) : null}
    </div>
  );
}
