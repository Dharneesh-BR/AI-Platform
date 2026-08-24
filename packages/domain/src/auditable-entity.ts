export type EntityId = string;

export interface AuditableEntity {
  id: EntityId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: EntityId | null;
  updatedBy: EntityId | null;
}

