import { Module } from '@nestjs/common';
import { ORGANIZATION_REPOSITORY } from './domain/repositories/organization.repository';
import { AddOrganizationMembershipUseCase } from './application/use-cases/add-organization-membership.use-case';
import { CreateOrganizationUseCase } from './application/use-cases/create-organization.use-case';
import { DeleteOrganizationUseCase } from './application/use-cases/delete-organization.use-case';
import { GetOrganizationUseCase } from './application/use-cases/get-organization.use-case';
import { ListOrganizationsUseCase } from './application/use-cases/list-organizations.use-case';
import { UpdateOrganizationMembershipUseCase } from './application/use-cases/update-organization-membership.use-case';
import { UpdateOrganizationUseCase } from './application/use-cases/update-organization.use-case';
import { PrismaOrganizationRepository } from './infrastructure/prisma/prisma-organization.repository';
import { OrganizationsController } from './presentation/controllers/organizations.controller';

@Module({
  controllers: [OrganizationsController],
  providers: [
    AddOrganizationMembershipUseCase,
    CreateOrganizationUseCase,
    DeleteOrganizationUseCase,
    GetOrganizationUseCase,
    ListOrganizationsUseCase,
    UpdateOrganizationMembershipUseCase,
    UpdateOrganizationUseCase,
    {
      provide: ORGANIZATION_REPOSITORY,
      useClass: PrismaOrganizationRepository,
    },
  ],
  exports: [ORGANIZATION_REPOSITORY],
})
export class OrganizationsModule {}