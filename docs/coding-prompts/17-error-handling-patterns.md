# Error Handling Patterns

## Backend — NestJS Services

### Use Built-in Exceptions
```typescript
throw new NotFoundException(`Organization ${id} not found`);
throw new ConflictException(`Slug "${slug}" is already taken`);
throw new ForbiddenException('You do not have access to this organization');
throw new UnauthorizedException('Invalid or expired token');
throw new BadRequestException('Permission key must match domain:action format');
```

### Where to Throw
- **Service layer** — always. This is where business rules live.
- **Controller layer** — never. Controllers are thin passthrough.
- **Guard/Middleware** — only for auth-related errors (401, 403).

### Guard Decisions Are NOT Errors
```typescript
// Guard check returns 200 with { allowed: false }, not 403
// This is a DECISION, not an error
return { allowed: false, matchedPermissions: [], decisionId: 'dec_xyz' };
```

### Catch Only When You Add Value
```typescript
// Bad: catch and re-throw with less info
try {
  return await this.prisma.org.create({ data });
} catch (e) {
  throw new Error('Failed to create org'); // Lost the real error
}

// Good: catch to ADD context, then throw specific exception
try {
  return await this.prisma.org.create({ data });
} catch (e) {
  if (e.code === 'P2002') throw new ConflictException(`Slug "${data.slug}" exists`);
  throw e; // Re-throw unknown errors
}
```

## Frontend — React Components

### Page-Level Error State
```typescript
function OrgsPage() {
  const { orgs, error, loading } = useOrganizations();

  if (loading) return <Skeleton />;
  if (error) return <ErrorCard message={error.message} onRetry={refetch} />;
  return <OrgTable data={orgs} />;
}
```

### Hook-Level Error Capture
```typescript
function useOrganizations() {
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    try { ... }
    catch (e) { setError(e instanceof Error ? e : new Error(String(e))); }
  }, []);

  return { orgs, error, loading };
}
```

### Never Silently Swallow
```typescript
// Bad
try { await api.deleteOrg(id); } catch {}

// Good
try { await api.deleteOrg(id); }
catch (e) { setError(e); }
```
