import type { AuditableEntity } from '@platform/domain';

export interface OrganizationEntity extends AuditableEntity {
  name: string;
  slug: string;
  description: string | null;
  settings: Record<string, unknown>;
}

