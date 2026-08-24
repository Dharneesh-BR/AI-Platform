# API Application

NestJS modular monolith API. Each module must preserve Clean Architecture boundaries:

- `presentation`: controllers, request DTOs, response DTOs
- `application`: use cases, commands, queries
- `domain`: entities, value objects, repository interfaces
- `infrastructure`: Prisma repositories, queue adapters, external service adapters

Modules must not import another module's internals.

