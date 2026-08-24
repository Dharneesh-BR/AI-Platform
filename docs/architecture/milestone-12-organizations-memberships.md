# Milestone 12: Organizations and Memberships

## Status

Drafted and implemented as foundational scaffolding.

## Purpose

Organizations define the primary tenant boundary. Memberships connect users to organizations with role and status metadata. All future project, research, knowledge-base, report, billing, and audit operations rely on this tenant boundary.

## Domain Rules

- Organization slugs must be stable and unique.
- Organization reads exclude soft-deleted records by default.
- Memberships are unique per organization and user.
- Super Admin can inspect all organizations.
- Admin can manage organizations where they hold an admin membership.
- Consultant, Client, and Viewer access is scoped to active memberships.

## API Surface

- `POST /api/v1/organizations`
- `GET /api/v1/organizations`
- `GET /api/v1/organizations/:id`
- `PATCH /api/v1/organizations/:id`
- `DELETE /api/v1/organizations/:id`
- `POST /api/v1/organizations/:id/memberships`
- `PATCH /api/v1/organizations/:id/memberships/:membershipId`

## Persistence Boundary

The application layer depends on `OrganizationRepository`. The Prisma implementation owns data mapping, soft-delete filtering, and query details.

## Security Boundary

Controllers rely on global JWT and role guards. Use cases still receive the authenticated user explicitly so authorization can remain testable outside NestJS.

