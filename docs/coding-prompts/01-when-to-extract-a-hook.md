# When to Extract a Hook

## The Rule
If a component has **any** of these, extract a hook:
- An API call or data fetch
- A `useEffect` with logic beyond trivial DOM setup
- State + derived computation (filter, sort, transform)
- Logic that another component might also need

## How to Name It
`use{Domain}{Action}` — describes what it manages, not where it's used.

```
useOrganizations()     // fetches + manages org list
useGuardCheck()        // runs a guard decision
useRoleTree()          // builds role hierarchy from flat data
useDebounce(value, ms) // generic utility hook
```

## What Goes Inside
```typescript
// hooks/use-organizations.ts
export function useOrganizations() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => { ... }, []);
  const create = useCallback(async (dto: CreateOrgDto) => { ... }, []);
  const remove = useCallback(async (id: string) => { ... }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { orgs, loading, error, create, remove, refetch: fetch };
}
```

## What Stays OUT
- JSX. Hooks never return JSX.
- Direct DOM manipulation. That's a ref callback or effect in the component.
- Theme/styling decisions. Those belong in the component.

## The Test
> "Can I describe this hook's job in one sentence without mentioning UI?"

Yes → good hook. No → it's doing too much or mixed with UI concerns.
