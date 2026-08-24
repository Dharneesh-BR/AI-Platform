import type { AuditableEntity } from '@platform/domain';
import type { PlatformRole } from '../../../../common/auth';

export enum OrganizationMembershipStatus {
  Invited = 'INVITED',
  Active = 'ACTIVE',
  Suspended = 'SUSPENDED',
  Removed = 'REMOVED',
}

export interface OrganizationMembershipEntity extends AuditableEntity {
  organizationId: string;
  userId: string;
  role: PlatformRole;
  status: OrganizationMembershipStatus;
  invitedAt: Date | null;
  joinedAt: Date | null;
}

