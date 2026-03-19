# Heimdal — Implementation Notes

> Internal working document for agents and engineers executing the fix plan.
> Keep this updated as you discover patterns, gotchas, and decisions.

---

## Architecture Patterns (Discovered During Code Review)

### Frontend Stack
- React 18 + TypeScript 5.7, Vite, React Router 6, TanStack Query v5, React Hook Form + Zod, `sonner` for toasts, `ky` for HTTP
- Global state: `AuthContext` (auth) + Zustand for theme. No Redux, no Zustand for data — everything is React Query.
- CSS: Custom CSS variables in `styles/theme.css` + `styles/globals.css`. Design tokens prefix: `deco-`. Not Tailwind classes from a CDN build — these are custom utility classes in globals.css.
- Path aliases: `@api/*`, `@auth/*`, `@components/*`, `@hooks/*`, `@lib/*`, `@pages/*` — defined in tsconfig.

### Backend Stack
- NestJS 11, Prisma 6, JWT + bcrypt auth, `ky`-style HTTP
- Global JWT guard with `@Public()` opt-out
- All admin routes: `admin/*` prefix
- All public auth routes: `auth/*` prefix

### Data-Fetching Patterns
- All hooks in `apps/admin/src/api/hooks/`
- Shape: `useQuery` with `queryKeys.*` + `useMutation` with `queryClient.invalidateQueries`
- Fetch functions return `PaginatedResponse<T>` = `{ data: T[], total: number, page: number, pageSize: number }`
- Backend returns raw arrays; hooks wrap them in PaginatedResponse
- Error handling: `decoToast.error(message)` in mutation `onError` or `catch` blocks

### Component Patterns
- Deco primitives: `DecoButton`, `DecoInput`, `DecoSelect`, `DecoTable`, `DecoBadge`, `DecoModal`, `DecoCard`, `DecoStatCard`, `DecoTextarea`, `DecoAvatar`, `DecoToast`
- Page structure: `div.space-y-5` > `PageHeader` > filter bar > `DecoTable | EmptyState`
- Modals always in the page file (not separate files) unless they're complex enough to warrant a section component
- `DecoTable` props: `columns: DecoColumnDef<T>[]`, `data: T[]`, `rowKey`
- `DecoColumnDef<T>`: `{ key: string, header: string, cell?: (row: T) => React.ReactNode, className?: string, headerClassName?: string }`

### Toast Calls
```typescript
import { decoToast } from '@components/primitives';
decoToast.success('Message');
decoToast.error('Message');
```

### Form Pattern
```typescript
const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormType>({
  resolver: zodResolver(schema),
  defaultValues: { ... },
});
```

### Mutation Pattern
```typescript
const mutation = useMutation({
  mutationFn: async (payload) => api.post('path', { json: payload }).json<ResponseType>(),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.x.all }),
  onError: (err) => decoToast.error(extractErrorMessage(err)), // see below
});
```

### API Error Extraction
Currently mutations use silent `catch {}` or generic messages. For proper error messages from the API:
```typescript
// Pattern to extract NestJS error messages from ky HTTPError:
async function getErrorMessage(err: unknown): Promise<string> {
  if (err instanceof HTTPError) {
    try {
      const body = await err.response.json<{ message?: string | string[] }>();
      const msg = Array.isArray(body.message) ? body.message[0] : body.message;
      return msg ?? 'An error occurred';
    } catch {
      return `HTTP ${err.response.status}`;
    }
  }
  return err instanceof Error ? err.message : 'An error occurred';
}
```
Note: `HTTPError` is exported from `ky`. We don't have a shared error utility yet — create one if needed at `@lib/errors.ts`.

---

## Prisma Migration Notes

All Prisma migrations run from `packages/prisma-client/`:
```bash
cd packages/prisma-client
npx prisma migrate dev --name <migration-name>
npx prisma generate
```

**IMPORTANT:** After any schema change, regenerate the client with `npx prisma generate`. The generated client is consumed by `@heimdal/prisma-client`.

---

## FIX-01: OrgContext — Implementation Notes

### Design Decision: Context Shape
The OrgContext is placed at `apps/admin/src/context/OrgContext.tsx`.

Provider placement in `App.tsx`:
```
QueryClientProvider
  → AuthProvider
    → OrgProvider   ← NEW: inside auth, outside router
      → ThemeInitializer
      → RouterProvider
```

**Why inside AuthProvider?** The OrgProvider calls `useOrganizations()` on mount which requires auth. If we put it outside, we'd need to duplicate auth checks.

### localStorage Key
`heimdal_active_org_id` — stores string orgId only (not the full org object). On mount, fetch org details by ID.

### Pages Requiring Org Context
| Page | How org is used |
|------|----------------|
| Applications | Filter by org — `useApplications(activeOrg?.id)` |
| Roles | Filter by app (scoped to org) — need App selector within page |
| Permissions | Filter by app (scoped to org) — need App selector within page |
| Users | Fetch members of org — `useMembers(activeOrg?.id ?? '')` |

### Pages NOT Requiring Org Context
| Page | Reason |
|------|--------|
| Organizations | Shows all orgs — this IS the org management page |
| Invites | Heimdal-level concern |
| Dashboard | Aggregates — optional filter only |
| Audit Log | Shows all events for admins |
| Profile | User-level |
| Guard Tester | Manual tool |

---

## FIX-02: Permission Model Notes

### API Route for Create
`POST /api/v1/admin/apps/:appId/permissions`

Body: `{ key: string, orgId: string, description?: string }`

**Important:** The `appId` goes in the URL, NOT in the body. The `orgId` goes in the body (the backend validates it exists). This is because the controller uses `@Param('appId')` + `@Body() dto`.

### org_cuid001 Hardcode Location
`apps/admin/src/pages/Permissions.tsx` line ~86:
```typescript
orgId: 'org_cuid001',
appId: 'app_ck7f801',
```
These must be replaced with `activeOrg.id` (for orgId) and a user-selected `appId` from a new form field.

---

## FIX-03: System Org Notes

### Migration
Add `isSystem Boolean @default(false)` to `Organization` model.

### Seed
The seed should mark the first/root org as `isSystem: true`. Check if seed file exists at `packages/prisma-client/prisma/seed.ts`.

### Frontend Badge
Add "SYSTEM" badge variant — use `DecoBadge variant="amber"` or a new `"system"` variant.

---

## FIX-04: Session Invalidation Notes

### Transaction Scope
The removal of sessions is wrapped in the org delete transaction. If session removal fails, the whole transaction rolls back (org is NOT deleted). This is the correct behavior — we don't want to delete an org but leave zombie sessions.

### Frontend Handling
After deleting an org, the ky `afterResponse` hook in `client.ts` handles 401s by redirecting to `/login`. We just need to ensure the org context is cleared and the next API call fails auth.

---

## FIX-07: Role Cascade Notes

The Prisma schema `Role` self-relation does NOT have `onDelete: Cascade` — this is intentional (we don't want accidental mass-deletion). Instead we re-parent orphaned children programmatically before deleting.

---

## FIX-08: Dashboard Module Notes

### New Module Location
`apps/api/src/modules/dashboard/`

Files needed:
- `dashboard.module.ts`
- `dashboard.service.ts`
- `dashboard.controller.ts`
- `index.ts`

Must be imported into `app.module.ts`.

### Route
`GET /api/v1/admin/dashboard/stats` (protected)

---

## FIX-09: Audit Log Notes

### Audit Event Type
Define in `apps/api/src/modules/audit/audit.service.ts`:
```typescript
interface AuditEvent {
  action: string;        // e.g., 'org.create', 'auth.login'
  actorId?: string;
  orgId?: string;
  resourceType?: string; // e.g., 'Organization', 'Application'
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}
```

### Audit Action Naming Convention
Format: `{domain}.{verb}` — all lowercase
Examples: `org.create`, `org.update`, `org.delete`, `app.create`, `role.create`, `permission.create`, `auth.login`, `auth.logout`, `invite.create`, `invite.revoke`

### Fire-and-Forget Pattern
```typescript
// In services:
this.auditService.log({ ... }).catch((err) =>
  this.logger.warn('Audit log failed', err.message),
);
```
Never `await` audit log calls in the main transaction path. Use fire-and-forget.

### AuditLog Query for Frontend
`GET /api/v1/admin/audit/logs?limit=50&offset=0&action=org.create&orgId=xxx`

---

## DecoStatCard Props (Confirmed from source)
```typescript
interface DecoStatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  accent?: 'amber' | 'teal' | 'purple' | 'green';
  onClick?: () => void;   // ADD THIS for FIX-19
  className?: string;
}
```

---

## Known Mock Data to Remove

| File | Mock Variable | Action |
|------|--------------|--------|
| `useUsers.ts` | `MOCK_MEMBERS` | Remove after real members endpoint works |
| `useAuditLog.ts` | `MOCK_AUDIT_LOG` | Remove after FIX-09 connects real API |
| `Dashboard.tsx` | `guardCallsData`, `userGrowthData`, `recentDecisions` | Replace with FIX-08 hook data |

---

## Import Path Reminders

```typescript
// Use alias imports, not relative paths:
import { useAuth } from '@auth/hooks/useAuth';
import { api } from '@api/client';
import { queryKeys } from '@lib/queryKeys';
import { decoToast } from '@components/primitives';
import type { Organization } from '@/types/models';

// Context (new):
import { useActiveOrg } from '@context/OrgContext';
```

---

## Test Checklist Per Fix

Before marking any fix complete, verify:
- [ ] `npm run type-check` passes (in `apps/admin/` and/or `apps/api/`)
- [ ] `npm run lint` passes
- [ ] Feature works in browser (manual smoke test)
- [ ] No hardcoded IDs remaining in changed files
- [ ] Barrel exports updated if new files added

---

## Final Verification Status (2026-03-13)

All 20 fixes implemented and verified.

### TypeScript
- `@heimdal/admin` — ✅ PASS (0 errors)
- `@heimdal/api` — ✅ PASS (0 errors)
- `@heimdal/shared` — ✅ PASS
- `@heimdal/prisma-client` — ✅ PASS
- `@heimdal/sdk` — ✅ PASS

### Lint
- `apps/admin` — ✅ PASS (0 errors)
- `apps/api` — ✅ PASS (0 errors)
- `packages/sdk` — ⚠️ SKIP: pre-existing missing `eslint.config.js` in SDK package (not introduced by any fix; the lint script was broken in original commit)

### Tests
- `org.service.spec.ts` — ✅ 38 tests passing
  - Spec was rewritten to match refactored service: added `AuditService` mock, `$transaction` mock, `orgMembership`/`session` tx mocks, `isSystem` test cases

### Prisma Migration Required (live environment only)
Run once in any environment with a live DB connection:
```bash
cd packages/prisma-client
npx prisma migrate dev --name add-org-is-system-flag
npx prisma generate
```
This applies `isSystem Boolean @default(false)` to the `organizations` table, regenerates the Prisma client, and removes the two `@ts-expect-error` comments in `org.service.ts`.
