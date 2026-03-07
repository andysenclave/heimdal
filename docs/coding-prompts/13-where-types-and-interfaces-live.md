# Where Types and Interfaces Live

## Decision Tree

```
Is this type shared between API and SDK?
  └─ Yes → packages/shared/src/types.ts (or a domain-specific types file)
  └─ No
       ├─ Is it a request/response shape? → modules/{feature}/dto/{name}.dto.ts
       ├─ Is it a Prisma-generated type? → import from @prisma/client (auto-generated)
       ├─ Is it specific to one module? → modules/{feature}/{feature}.types.ts
       ├─ Is it a frontend component prop? → defined inline in the component file
       └─ Is it a cross-cutting concern? → apps/api/src/common/types.ts
```

## Shared Types (`@heimdal/shared`)
Types that BOTH the API and the SDK (or admin UI) consume.
```typescript
// These live in packages/shared/src/index.ts
export interface GuardCheckRequest { ... }
export interface GuardCheckResponse { ... }
export interface HeimdalJwtClaims { ... }
export interface HealthResponse { ... }
```

## Module-Specific Types
Types used only within one module. Don't over-share.
```typescript
// modules/entitlement/entitlement.types.ts
export interface ResolvedPermissions {
  direct: string[];
  inherited: string[];
  all: string[];
}

export interface RoleHierarchyNode {
  role: Role;
  children: RoleHierarchyNode[];
  depth: number;
}
```

## Frontend Component Props
Define inline in the component file. Don't create a separate types file for 3-field prop interfaces.
```typescript
// sections/guard-trace.tsx
interface GuardTraceProps {
  result: 'allowed' | 'denied' | null;
  steps: TraceStep[];
}

function GuardTrace({ result, steps }: GuardTraceProps) { ... }
```

## Rules
- **Interface** for object shapes (props, API responses, configs).
- **Type** for unions, intersections, and computed types.
- **No `I` prefix.** `GuardCheckRequest`, not `IGuardCheckRequest`.
- **No `T` prefix.** `ThemeTokens`, not `TThemeTokens`.
- **Export `type` keyword** when re-exporting from barrels: `export type { GuardCheckRequest }`.
- Don't create a types file until you have 3+ types. Below that, inline is fine.
