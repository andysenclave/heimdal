# Heimdal - Coding Instructions

> IAM platform by Thimple. NestJS modular monolith + TurboRepo monorepo.
> Stack: TypeScript 5.7 | NestJS 11 | Prisma 6 | Jest 29 | Node 20+

## Detailed Coding Prompts

When making architectural decisions, **read the relevant prompt file** from `docs/coding-prompts/` before writing code:

| Decision | Read This File |
|----------|---------------|
| Extracting logic from a component | `docs/coding-prompts/01-when-to-extract-a-hook.md` |
| Placing a component in `common/` | `docs/coding-prompts/02-when-component-goes-in-common.md` |
| Creating a section component | `docs/coding-prompts/03-when-component-is-a-section.md` |
| Creating a page component | `docs/coding-prompts/04-when-component-is-a-page.md` |
| Theming, tokens, dark/light mode | `docs/coding-prompts/05-theming-and-design-tokens.md` |
| Barrel exports and index.ts files | `docs/coding-prompts/06-barrel-exports-and-index-files.md` |
| Designing a DTO | `docs/coding-prompts/07-how-to-design-a-dto.md` |
| Writing a unit test | `docs/coding-prompts/08-how-to-unit-test-a-service.md` |
| Writing an integration test | `docs/coding-prompts/09-how-to-integration-test-an-endpoint.md` |
| Scaffolding a new NestJS module | `docs/coding-prompts/10-how-to-scaffold-a-new-module.md` |
| Designing a new permission key | `docs/coding-prompts/11-how-to-design-a-permission.md` |
| Writing Prisma queries | `docs/coding-prompts/12-how-to-write-prisma-queries.md` |
| Where to put types/interfaces | `docs/coding-prompts/13-where-types-and-interfaces-live.md` |
| Structuring a service method | `docs/coding-prompts/14-how-to-structure-a-service-method.md` |
| Making a reusable component | `docs/coding-prompts/15-how-to-make-a-reusable-component.md` |
| Choosing state management approach | `docs/coding-prompts/16-state-management-decisions.md` |
| Handling errors (frontend + backend) | `docs/coding-prompts/17-error-handling-patterns.md` |
| Understanding data flow layers | `docs/coding-prompts/18-data-flow-architecture.md` |

---

## 1. Monorepo Structure

```
heimdal/
├── apps/
│   └── api/                    # NestJS API (the only app for now)
│       └── src/
│           ├── main.ts
│           ├── app.module.ts
│           ├── common/         # Shared guards, pipes, decorators, filters
│           └── modules/        # Feature modules (auth, org, guard, etc.)
├── packages/
│   ├── shared/                 # @heimdal/shared — types, constants, validators
│   ├── prisma-client/          # @heimdal/prisma-client — schema + generated client
│   └── sdk/                    # @heimdal/sdk — public TypeScript SDK
├── docs/
│   ├── adr/                    # Architecture Decision Records
│   └── api/                    # API documentation
├── turbo.json
├── tsconfig.base.json
└── CLAUDE.md                   # This file
```

**Rules:**
- `packages/` = shared libraries consumed by `apps/` or external users.
- `apps/` = deployable services.
- Every package has its own `package.json`, `tsconfig.json`, and `src/index.ts` barrel.
- Cross-package imports use workspace names: `import { X } from '@heimdal/shared'`.
- Never import across apps. Always go through a package.

---

## 2. Module Architecture (NestJS Backend)

Each feature lives in `apps/api/src/modules/{feature}/`:

```
modules/auth/
├── auth.module.ts       # NestJS module declaration
├── auth.controller.ts   # HTTP routes only — no business logic
├── auth.service.ts      # All business logic lives here
├── dto/                 # Request/response DTOs with class-validator
│   ├── signup.dto.ts
│   └── login.dto.ts
├── guards/              # Module-specific guards (if any)
├── __tests__/           # Unit + integration tests
│   ├── auth.service.spec.ts
│   └── auth.controller.spec.ts
└── index.ts             # Barrel export: module + public types
```

**Rules:**
- Controllers are thin. They validate input (via DTOs + pipes), call service methods, and return responses. No business logic.
- Services own all business logic. They call Prisma, validate rules, throw exceptions.
- One module = one domain concept. Don't mix concerns.
- Barrel exports (`index.ts`) re-export only the module and public types/DTOs.
- Module-specific guards, interceptors, pipes go inside the module folder. Cross-cutting ones go in `common/`.

---

## 3. File & Folder Naming

| Type | Convention | Example |
|------|-----------|---------|
| Folders | `kebab-case` | `prisma-client/`, `access-binding/` |
| Files (backend) | `kebab-case.suffix.ts` | `auth.controller.ts`, `signup.dto.ts` |
| Files (frontend) | `kebab-case.tsx` for components | `stat-card.tsx`, `guard-tester.tsx` |
| Classes | `PascalCase` | `AuthService`, `CreateOrgDto` |
| Interfaces | `PascalCase` | `GuardCheckRequest` (no `I` prefix) |
| Constants | `UPPER_SNAKE_CASE` | `API_VERSION`, `PERMISSION_PATTERN` |
| Functions | `camelCase` | `isValidPermission()`, `resolveRoles()` |
| Test files | `*.spec.ts` | `auth.service.spec.ts` |
| Type-only files | `*.types.ts` | `entitlement.types.ts` |

**Never:** `AuthControllerFile.ts`, `IGuardRequest`, `my_util.ts`

---

## 4. TypeScript Conventions

- **Strict mode always.** `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` are enforced.
- **Interfaces for object shapes.** `type` for unions, intersections, mapped types.
- **No `any`.** Use `unknown` and narrow. If you must escape, add `// eslint-disable-next-line` with a reason.
- **`as const` for constant objects.** See `ID_PREFIXES` in `@heimdal/shared`.
- **Explicit return types on public service methods.** Skip for trivial private helpers.
- **No enums.** Use `as const` objects + `type X = (typeof OBJ)[keyof typeof OBJ]` pattern.
- **DTOs use `class` with decorators** (class-validator). Everything else uses interfaces or types.

```typescript
// Good: const object + derived type
export const ORG_ROLES = { OWNER: 'owner', ADMIN: 'admin', MEMBER: 'member' } as const;
export type OrgRole = (typeof ORG_ROLES)[keyof typeof ORG_ROLES];

// Bad: enum
enum OrgRole { Owner = 'owner' }
```

---

## 5. Shared Package (`@heimdal/shared`)

This package is the **single source of truth** for cross-cutting types and constants.

**What goes here:**
- Types shared between API and SDK: `GuardCheckRequest`, `GuardCheckResponse`, `HeimdalJwtClaims`
- Constants: `API_VERSION`, `ID_PREFIXES`, `PERMISSION_PATTERN`
- Pure validation functions: `isValidPermission()`
- No runtime dependencies. No framework imports. Pure TypeScript only.

**What does NOT go here:**
- NestJS decorators, modules, or services
- Prisma types (those come from `@heimdal/prisma-client`)
- Business logic or stateful code

---

## 6. Prisma Conventions

- Schema lives at `packages/prisma-client/prisma/schema.prisma`.
- All IDs are **CUIDs** (not UUIDs). Use `@default(cuid())`.
- ID fields use prefixed format in application logic: `user_`, `org_`, `app_`, etc.
- Table names are `PascalCase` singular: `Organization`, `User`, `AccessBinding`.
- Every model has `createdAt` and `updatedAt`. Soft-deletable models add `deletedAt DateTime?`.
- Foreign key fields: `{relation}Id` pattern — `orgId`, `appId`, `parentRoleId`.
- Add `@@index` on every foreign key and frequently queried field.
- Cascading deletes on join tables only. Relations to core entities use `Restrict` or application-level checks.

```prisma
model Role {
  id           String   @id @default(cuid())
  orgId        String
  appId        String
  name         String
  parentRoleId String?
  isSystem     Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  org        Organization @relation(fields: [orgId], references: [id])
  app        Application  @relation(fields: [appId], references: [id])
  parentRole Role?        @relation("RoleHierarchy", fields: [parentRoleId], references: [id])
  childRoles Role[]       @relation("RoleHierarchy")

  @@unique([appId, name])
  @@index([orgId])
  @@index([appId])
}
```

---

## 7. Testing Strategy

### Unit Tests (every service method)
- File: `__tests__/{name}.service.spec.ts` inside the module folder.
- Mock all dependencies (Prisma, other services) using Jest mocks.
- Test: happy path, edge cases, error/exception paths.
- Each test should be independent — no shared mutable state.

### Controller Tests (thin, request/response shape)
- File: `__tests__/{name}.controller.spec.ts`.
- Use NestJS `Test.createTestingModule()`.
- Mock the service. Verify the controller calls the right service method with the right args.
- Verify response shape and status codes.

### Integration Tests (API endpoints)
- File: `__tests__/{name}.e2e-spec.ts` or `test/` folder.
- Use `supertest` with a real NestJS app instance.
- Test full request lifecycle: auth, validation, DB operations, response.
- Use a test database (separate from dev).

### What to test:
- **Always test:** Service business logic, guard decisions, permission resolution, DTOs.
- **Lightly test:** Controllers (they're thin), pure utility functions.
- **Don't test:** Prisma schema itself, NestJS framework internals, third-party libraries.

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockDeep<PrismaClient>() },
      ],
    }).compile();

    service = module.get(AuthService);
    prisma = module.get(PrismaService);
  });

  it('should throw on duplicate email', async () => {
    prisma.user.findUnique.mockResolvedValue(existingUser);
    await expect(service.signup(dto)).rejects.toThrow(ConflictException);
  });
});
```

---

## 8. Error Handling

- Use NestJS built-in exceptions: `NotFoundException`, `ConflictException`, `ForbiddenException`, `UnauthorizedException`, `BadRequestException`.
- Throw from services, not controllers.
- For domain-specific errors, create custom exceptions extending `HttpException` in `common/exceptions/`.
- Never catch and swallow errors silently. Log and re-throw or let NestJS global exception filter handle it.
- Guard check denials return `{ allowed: false }` with 200 status — they're not errors, they're decisions.

---

## 9. Permission & RBAC Conventions

- Permission format: `domain:action` — lowercase only, validated by `PERMISSION_PATTERN`.
- Examples: `portfolio:read`, `trade:execute`, `watchlist:manage`.
- Roles form a hierarchy: `super-admin > org-admin > app-admin > [custom roles]`.
- Child roles inherit all permissions from their parent.
- Guard resolution order: validate JWT → check session → resolve user roles → collect permissions (direct + inherited) → match against requested resource.
- The JWT claims contract (`HeimdalJwtClaims`) is **locked**. Changes break all consumers.

---

## 10. API Design

- Global prefix: `/api/v1`.
- RESTful resource routes: `GET /orgs`, `POST /orgs`, `GET /orgs/:id`, `PATCH /orgs/:id`.
- Guard endpoint: `POST /guard/check` (not REST — it's an RPC-style decision endpoint).
- All request bodies validated via DTOs with `class-validator` decorators.
- Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- Swagger docs auto-generated at `/docs`.
- Auth: Bearer token (JWT) + API key (`X-App-Id` header) for SDK calls.

---

## 11. Frontend Conventions (Admin UI + SDK)

When building React components (admin panel, SDK React Native hooks):

### Component Hierarchy
```
components/
├── common/              # Reusable, stateless, "dumb" components
│   ├── button.tsx       # DecoButton, variants via props
│   ├── card.tsx         # DecoCard, DecoStatCard
│   ├── badge.tsx        # DecoBadge, DecoPill
│   ├── table.tsx        # DecoTable, DecoTableRow
│   ├── input.tsx        # DecoInput, DecoSelect
│   └── modal.tsx        # ModalOverlay, DecoModal
├── sections/            # Composed blocks used within pages
│   ├── role-tree.tsx    # Role hierarchy visualization
│   ├── guard-trace.tsx  # Guard decision trace display
│   └── mini-chart.tsx   # Bar charts, donut charts
└── pages/               # Full page components, one per route
    ├── dashboard.tsx
    ├── organizations.tsx
    ├── applications.tsx
    ├── roles.tsx
    ├── permissions.tsx
    ├── guard-tester.tsx
    ├── audit-log.tsx
    └── profile.tsx
```

### Rules:
- **Common components are dumb.** They receive data + callbacks via props. No API calls, no global state, no side effects.
- **Pages are smart.** They fetch data, manage local state, compose sections and common components.
- **Sections are middle ground.** They compose common components into meaningful UI blocks but don't own data fetching.
- **Hooks extract logic.** `useGuardCheck()`, `useOrganizations()`, `useAuth()` — all data fetching and state logic lives in hooks, not in components.
- **Props > context for component config.** Use React Context only for truly global state (theme, auth session). Everything else is props.
- **One component per file.** Exception: tightly coupled sub-components that are never used elsewhere.

### Hook Pattern
```typescript
// hooks/use-organizations.ts
export function useOrganizations() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrgs = useCallback(async () => { /* ... */ }, []);
  const createOrg = useCallback(async (dto: CreateOrgDto) => { /* ... */ }, []);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  return { orgs, loading, error, createOrg, refetch: fetchOrgs };
}

// pages/organizations.tsx — THIN, just wires hooks to UI
function OrganizationsPage() {
  const { orgs, loading, createOrg } = useOrganizations();
  const [modal, setModal] = useState<string | null>(null);

  if (loading) return <Skeleton />;
  return <OrgTable data={orgs} onAdd={() => setModal('create')} />;
}
```

---

## 12. Formatting & Linting

- **Prettier:** Semi, single quotes, trailing commas, 100 char width, 2-space tabs, LF line endings.
- **ESLint:** Flat config (v9) with `@typescript-eslint`. No `any`, no unused vars, no console.log in production code.
- Run `npm run format` before committing. CI enforces `format:check`.
- Run `npm run lint` and `npm run type-check`. Both must pass in CI.

---

## 13. Git & Branch Conventions

- Branch format: `HD-{number}-{short-description}` (e.g., `HD-013-org-crud`).
- Commit messages: imperative mood, lowercase start. `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.
- PR targets: feature branches merge to `develop`, `develop` merges to `staging`, `staging` to `main`.
- CI runs: lint, type-check, build, test on every PR.
- Never force-push to `develop`, `staging`, or `main`.

---

## 14. Environment & Infrastructure

- PostgreSQL 16 (Neon in prod, Docker locally).
- Redis 7 (Upstash in prod, Docker locally).
- Docker Compose for local dev: `docker-compose up`.
- `.env` file at root — never commit secrets. Use `.env.example` as template.
- Deployment: Render (planned).

---

## 15. Architecture Decision Records

All significant technical decisions are documented in `docs/adr/`.

**Locked decisions (do not change without new ADR):**
- ADR-001: Modular monolith (not microservices)
- ADR-004: JWT claims shape (`HeimdalJwtClaims`)
- ADR-005: Permission format (`domain:action`, pattern `/^[a-z]+:[a-z]+$/`)

---

## Quick Reference Commands

```bash
npm run dev              # Start all packages in watch mode
npm run build            # Build all packages (respects dependency order)
npm run test             # Run all tests
npm run lint             # Lint all packages
npm run type-check       # TypeScript checks
npm run format           # Format all files with Prettier

# Prisma (from packages/prisma-client/)
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Create + apply migration
npx prisma studio        # Visual DB browser

# Docker
docker-compose up        # Start PostgreSQL + Redis + API
```
