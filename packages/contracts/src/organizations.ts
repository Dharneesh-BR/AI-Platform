export enum OrganizationMembershipStatus {
  Invited = 'INVITED',
  Active = 'ACTIVE',
  Suspended = 'SUSPENDED',
  Removed = 'REMOVED',
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMembershipSummary {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  status: OrganizationMembershipStatus;
  invitedAt: string | null;
  joinedAt: string | null;
}

