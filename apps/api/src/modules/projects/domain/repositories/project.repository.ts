import type { AuthenticatedUser } from '../../../../common/auth';
import type { ProjectEntity } from '../entities/project.entity';

export const PROJECT_REPOSITORY = Symbol('PROJECT_REPOSITORY');

export interface CreateProjectInput {
  name: string;
  slug: string;
  description?: string;
  actor: AuthenticatedUser;
}

export interface UpdateProjectInput {
  projectId: string;
  name?: string;
  description?: string | null;
  actor: AuthenticatedUser;
}

export interface ProjectRepository {
  create(input: CreateProjectInput): Promise<ProjectEntity>;
  list(actor: AuthenticatedUser): Promise<ProjectEntity[]>;
  findById(projectId: string, actor: AuthenticatedUser): Promise<ProjectEntity | null>;
  update(input: UpdateProjectInput): Promise<ProjectEntity>;
  delete(projectId: string, actor: AuthenticatedUser): Promise<void>;
}
