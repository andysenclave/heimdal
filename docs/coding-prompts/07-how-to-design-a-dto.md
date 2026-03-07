# How to Design a DTO

## What is a DTO?
A Data Transfer Object defines the **exact shape** of data crossing a boundary (HTTP request body, response payload). It's the contract.

## When to Create One
- Every `POST` / `PUT` / `PATCH` request body → request DTO.
- Every response with a specific shape → response DTO (or shared type).
- Never pass raw Prisma models to the client. Always map through a DTO.

## File Location
```
modules/org/
└── dto/
    ├── create-org.dto.ts
    ├── update-org.dto.ts
    └── org-response.dto.ts
```

## Structure — Request DTO
```typescript
// dto/create-org.dto.ts
import { IsString, IsNotEmpty, IsOptional, Matches, MaxLength } from 'class-validator';

export class CreateOrgDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase alphanumeric with hyphens' })
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
```

## Rules
- **One class per file.** Name matches the file: `CreateOrgDto` in `create-org.dto.ts`.
- **Use `class` with decorators**, not interfaces. NestJS validation pipes need classes.
- **Every field has validation.** No unvalidated fields on request DTOs.
- **Optional fields use `@IsOptional()` + `?`** — both the decorator and the TS optional marker.
- **Suffix is always `Dto`**: `CreateOrgDto`, `UpdateRoleDto`, `GuardCheckDto`.
- **No business logic.** DTOs are shapes, not behaviors.
- **Response DTOs** can be plain interfaces (no decorators needed) or use `class-transformer` `@Exclude()` to strip sensitive fields.

## Anti-patterns
```typescript
// Bad: raw Prisma model as response
return await this.prisma.organization.findMany();

// Good: map through response shape
const orgs = await this.prisma.organization.findMany();
return orgs.map(o => ({ id: o.id, name: o.name, slug: o.slug, memberCount: o._count.members }));
```
