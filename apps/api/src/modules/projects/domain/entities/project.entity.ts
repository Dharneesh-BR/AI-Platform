import type { AuditableEntity } from '@platform/domain';
import type { ProjectLifecycleState } from '@platform/domain';

export interface ProjectEntity extends AuditableEntity {
  name: string;
  slug: string;
  description: string | null;
  status: string;
  lifecycleState: ProjectLifecycleState;
  metadata: Record<string, unknown>;
  nextRoute: string;
}
