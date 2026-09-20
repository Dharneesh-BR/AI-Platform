'use client';

import { useUsers } from '../../../lib/api/query-hooks';
import { useAuth } from '../../../lib/auth/session';

export function AdminUsersPanel() {
  const { session } = useAuth();
  const usersQuery = useUsers({ accessToken: session.accessToken, organizationId: session.organizationId });
  const users = usersQuery.data ?? [];

  return (
    <div className="timeline section-gap">
      {users.map((user) => (
        <div className="timeline-item" key={user.id}>
          <div>
            <strong>{user.displayName ?? user.email}</strong>
            <p>{user.email}</p>
          </div>
        </div>
      ))}
      {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 ? (
        <p>No users were returned by the API.</p>
      ) : null}
    </div>
  );
}
