# How to Write Prisma Queries

## Always Scope by Tenant
Every query that touches tenant data MUST include `orgId` in the `where` clause. Never return data across org boundaries.

```typescript
// Good: scoped to org
const roles = await this.prisma.role.findMany({
  where: { orgId, appId },
  orderBy: { createdAt: 'desc' },
});

// Bad: leaks cross-tenant data
const roles = await this.prisma.role.findMany({
  where: { appId },
});
```

## Select Only What You Need
Don't fetch entire models when you need 2 fields. Use `select` for read-heavy queries.

```typescript
// Good: lightweight
const users = await this.prisma.user.findMany({
  where: { orgMemberships: { some: { orgId } } },
  select: { id: true, email: true, name: true },
});

// Bad: fetches everything including sensitive fields
const users = await this.prisma.user.findMany({
  where: { orgMemberships: { some: { orgId } } },
});
```

## Use Transactions for Multi-Step Writes
When creating related records together, wrap in a transaction.

```typescript
const result = await this.prisma.$transaction(async (tx) => {
  const role = await tx.role.create({ data: { name, orgId, appId } });
  await tx.rolePermission.createMany({
    data: permissionIds.map(pid => ({ roleId: role.id, permissionId: pid })),
  });
  return role;
});
```

## Include vs Select
- **`include`**: fetches the relation as a nested object. Use for detail views.
- **`select`**: picks specific fields. Use for list views and performance.
- Never use both on the same query.

## Soft Delete Pattern
```typescript
// "Delete" — set deletedAt
await this.prisma.organization.update({
  where: { id },
  data: { deletedAt: new Date(), isActive: false },
});

// Query — always filter out deleted
const orgs = await this.prisma.organization.findMany({
  where: { deletedAt: null },
});
```

## Counting Relations
```typescript
const orgs = await this.prisma.organization.findMany({
  where: { deletedAt: null },
  include: {
    _count: { select: { members: true, applications: true } },
  },
});
// Access: org._count.members, org._count.applications
```
