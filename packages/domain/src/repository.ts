import type { EntityId } from './auditable-entity';

export interface Repository<TEntity> {
  findById(id: EntityId): Promise<TEntity | null>;
}
