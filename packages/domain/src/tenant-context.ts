import type { EntityId } from './auditable-entity';

export interface TenantContext {
  organizationId: EntityId;
  userId: EntityId;
  roles: string[];
}

