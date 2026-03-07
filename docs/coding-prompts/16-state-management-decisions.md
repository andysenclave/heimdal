# State Management Decisions

## Decision Tree

```
Where does this state belong?

Is it global across the entire app?
  ├─ Theme (dark/light) → React Context (ThemeContext)
  ├─ Auth session (user, token) → React Context (AuthContext)
  └─ Active organization → React Context (OrgContext)

Is it page-level?
  ├─ Which modal is open → useState in the page component
  ├─ Selected tab/filter → useState in the page component
  └─ Fetched data (orgs, roles, etc.) → custom hook (useOrganizations)

Is it section-level?
  └─ Accordion open/close, local toggle → useState in the section

Is it component-level?
  ├─ Input focus state → useState in the input
  ├─ Hover state → useState or CSS :hover
  └─ Dropdown open/close → useState in the dropdown
```

## What Goes in Context (Sparingly)
```typescript
// Only these deserve context:
<ThemeContext.Provider value={tokens}>     // Theme tokens
<AuthContext.Provider value={session}>     // Current user + token
<OrgContext.Provider value={activeOrg}>    // Selected organization
```

## What Goes in Hooks (Most Things)
```typescript
// Data fetching + mutations = hooks
const { orgs, loading, create } = useOrganizations();
const { result, runCheck } = useGuardCheck();
const { roles, loading } = useRoles(appId);
```

## What Stays Local (Always Start Here)
```typescript
// UI state = local useState
const [modal, setModal] = useState<string | null>(null);
const [filter, setFilter] = useState('all');
const [collapsed, setCollapsed] = useState(false);
```

## Rules
- **Start local.** Only lift state up when two components need the same state.
- **No Redux, no Zustand** unless the app proves it needs them. Context + hooks covers 95%.
- **Never store derived data.** If `filteredOrgs` can be computed from `orgs` + `filter`, compute it. Don't store it.
- **URL is state too.** Active page, selected ID, and filter values can live in the URL/route params.

```typescript
// Good: derived
const activeOrgs = orgs.filter(o => o.isActive);

// Bad: duplicate state
const [activeOrgs, setActiveOrgs] = useState([]);
useEffect(() => setActiveOrgs(orgs.filter(o => o.isActive)), [orgs]);
```
