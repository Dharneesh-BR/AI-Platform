import type { AuthenticatedUser } from '../../../../common/auth';
import type { ProjectLifecycleState } from '@platform/domain';

export const PROJECT_LIFECYCLE_REPOSITORY = Symbol('PROJECT_LIFECYCLE_REPOSITORY');

export interface ProjectLifecycleRepository {
  getLifecycleState(projectId: string, actor: AuthenticatedUser): Promise<ProjectLifecycleState>;
  transition(
    projectId: string,
    nextState: ProjectLifecycleState,
    actor: AuthenticatedUser,
  ): Promise<ProjectLifecycleState>;
}
