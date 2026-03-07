# How to Structure a Service Method

## The Four Phases
Every service method follows this order:

```
1. VALIDATE   → Business rule checks (not input shape — DTOs handle that)
2. RESOLVE    → Fetch related data needed for the operation
3. EXECUTE    → Perform the core operation (create, update, delete)
4. RETURN     → Map to response shape, never return raw Prisma models
```

## Example
```typescript
async createRole(orgId: string, dto: CreateRoleDto): Promise<RoleResponse> {
  // 1. VALIDATE — business rules
  const existingRole = await this.prisma.role.findFirst({
    where: { appId: dto.appId, name: dto.name },
  });
  if (existingRole) {
    throw new ConflictException(`Role "${dto.name}" already exists in this app`);
  }

  // 2. RESOLVE — fetch related data
  const app = await this.prisma.application.findUnique({
    where: { id: dto.appId },
  });
  if (!app || app.orgId !== orgId) {
    throw new NotFoundException('Application not found in this organization');
  }

  // 3. EXECUTE — do the thing
  const role = await this.prisma.$transaction(async (tx) => {
    const created = await tx.role.create({
      data: { name: dto.name, orgId, appId: dto.appId, parentRoleId: dto.parentRoleId },
    });
    if (dto.permissionIds?.length) {
      await tx.rolePermission.createMany({
        data: dto.permissionIds.map(pid => ({ roleId: created.id, permissionId: pid })),
      });
    }
    return created;
  });

  // 4. RETURN — shape the response
  return {
    id: role.id,
    name: role.name,
    appId: role.appId,
    parentRoleId: role.parentRoleId,
    createdAt: role.createdAt.toISOString(),
  };
}
```

## Rules
- **Throw from the service, not the controller.** The controller just calls `this.service.method(dto)`.
- **Use NestJS exceptions**: `ConflictException`, `NotFoundException`, `ForbiddenException`, `BadRequestException`.
- **Explicit return type** on every public method. Helps catch accidental Prisma model leaks.
- **One operation per method.** `createRole()` creates. `updateRole()` updates. Don't combine.
- **Always scope by `orgId`** for tenant-scoped operations.
- **Log audit events** at the end of mutating operations (create, update, delete).
