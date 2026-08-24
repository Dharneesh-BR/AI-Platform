import type { EntityId } from './auditable-entity';
import type { TenantContext } from './tenant-context';

export interface Repository<TEntity> {
  findById(id: EntityId, context: TenantContext): Promise<TEntity | null>;
}

