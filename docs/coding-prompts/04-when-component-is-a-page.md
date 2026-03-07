# When a Component is a Page

## The Decision
A page is the **top-level component for a route**. It owns data, state, and orchestration. One page per route.

## A Page Does These Things
1. **Calls hooks** to fetch and manage data
2. **Holds modal/dialog state** (which modal is open)
3. **Passes data down** to sections and common components
4. **Handles callbacks** from child components (create, edit, delete)
5. **Manages loading/error states** at the page level

## A Page Does NOT Do These Things
- Define reusable UI primitives (that's `common/`)
- Contain complex rendering logic (extract to sections)
- Make API calls directly (use hooks)
- Be used inside another page

## Page Template
```typescript
// pages/organizations.tsx
function OrganizationsPage() {
  const { orgs, loading, error, create, remove } = useOrganizations();
  const [modal, setModal] = useState<string | null>(null);

  if (loading) return <PageSkeleton />;
  if (error) return <PageError error={error} />;

  return (
    <div>
      <PageHeader
        title="Organizations"
        subtitle="Manage tenants and configurations"
        action={<Button onClick={() => setModal('create')}>+ New Org</Button>}
      />
      <OrgTable orgs={orgs} onEdit={(id) => setModal(`edit:${id}`)} />
      {modal === 'create' && <CreateOrgModal onClose={() => setModal(null)} onCreate={create} />}
    </div>
  );
}
```

## Page ↔ Route Mapping
```
/dashboard      → pages/dashboard.tsx
/organizations  → pages/organizations.tsx
/apps           → pages/applications.tsx
/roles          → pages/roles.tsx
/permissions    → pages/permissions.tsx
/guard          → pages/guard-tester.tsx
/audit          → pages/audit-log.tsx
/profile        → pages/profile.tsx
```

One file. One route. One page.
