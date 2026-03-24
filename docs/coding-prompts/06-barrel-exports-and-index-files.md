# Barrel Exports and Index Files

## What is a Barrel?
An `index.ts` that re-exports the public API of a folder. It controls what's visible outside.

## When to Create One
- Every `packages/*/src/index.ts` — always. This IS the package entry point.
- Every `modules/{feature}/index.ts` — always. Exports the module + public types.
- `common/index.ts` — yes. One import for all common components.
- `hooks/index.ts` — yes. One import for all hooks.
- `sections/index.ts` — optional. Only if there are 5+ sections.

## When NOT to Create One
- Inside a single component folder (e.g., `common/button/index.ts` — overkill if it's one file).
- For `__tests__/` folders — never export tests.
- For `dto/` folders with 1-2 files — import directly.

## Pattern

```typescript
// modules/auth/index.ts
export { AuthModule } from './auth.module';
export type { SignupDto } from './dto/signup.dto';
export type { LoginDto } from './dto/login.dto';
// Do NOT export: AuthService, AuthController (internal to module)

// packages/shared/src/index.ts
export { API_VERSION, API_PREFIX, PERMISSION_PATTERN, ID_PREFIXES } from './constants';
export { isValidPermission } from './validators';
export type { GuardCheckRequest, GuardCheckResponse, HeimdalJwtClaims } from './types';

// common/index.ts
export { Button } from './button';
export { Badge, Pill } from './badge';
export { Card, StatCard } from './card';
export { Table, TableRow } from './table';
export { Input, Select } from './input';
export { Modal, ModalOverlay } from './modal';
```

## Consuming
```typescript
// Good: import from barrel
import { Button, Badge, Card } from '@/components/common';
import { AuthModule } from '@/modules/auth';

// Bad: reaching into internals
import { Button } from '@/components/common/button';
import { AuthService } from '@/modules/auth/auth.service';
```

## Rule: `type` keyword for type-only exports
If you're re-exporting an interface or type, use `export type`. This helps tree-shaking and makes intent clear.
