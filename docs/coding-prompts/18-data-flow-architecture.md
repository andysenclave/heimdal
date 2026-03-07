# Data Flow Architecture

## Backend Flow (API Request)
```
Client Request
  → NestJS Middleware (CORS, logging)
    → Guard (JWT validation, role check)
      → Controller (parse params, call service)
        → Service (business logic, validation)
          → Prisma (database query)
        ← Service (map to response DTO)
      ← Controller (return response)
    ← Guard
  ← Middleware
Client Response
```

## Frontend Flow (UI Render)
```
API / Backend
  ↓
Hook (useOrganizations)          ← Fetches data, manages loading/error
  ↓
Page (OrganizationsPage)         ← Orchestrates, holds modal state
  ↓
Section (OrgTable, OrgStats)     ← Composes common components with domain data
  ↓
Common (Table, Badge, Button)    ← Renders pure UI from props
```

## Data Ownership Rules

| Layer | Owns | Receives | Passes Down |
|-------|------|----------|-------------|
| **Hook** | API calls, loading/error state, mutation functions | Nothing — it's the source | `{ data, loading, error, mutate }` |
| **Page** | Modal state, selected filters, which hook to call | Hook return values | Data to sections, callbacks |
| **Section** | Internal UI state (accordion, hover) | Domain data via props | Data to common components |
| **Common** | Visual state (focus, hover) | Display data + callbacks via props | Nothing — leaf nodes |

## Key Principle: Data Flows Down, Events Flow Up
```
Page
  ├── passes `orgs` data DOWN to OrgTable
  └── passes `onEdit` callback DOWN to OrgTable
        └── OrgTable calls onEdit(id) UP when user clicks Edit
              └── Page opens modal with that ID
```

## Anti-Patterns
```typescript
// Bad: Section fetches its own data
function OrgTable() {
  const { orgs } = useOrganizations(); // NO — page should own this
  return <Table>{orgs.map(...)}</Table>;
}

// Good: Section receives data
function OrgTable({ orgs, onEdit }: OrgTableProps) {
  return <Table>{orgs.map(o => <Row onClick={() => onEdit(o.id)} />)}</Table>;
}
```
