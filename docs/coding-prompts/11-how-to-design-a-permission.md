# How to Design a Permission

## Format (Locked — ADR-005)
```
domain:action
```
- **domain**: the resource area (`portfolio`, `trade`, `watchlist`, `market`, `user`, `org`)
- **action**: the operation (`read`, `write`, `execute`, `manage`, `delete`, `invite`)
- Both parts: lowercase alphabetic only. No numbers, no hyphens, no dots.
- Regex: `/^[a-z]+:[a-z]+$/`

## Valid Examples
```
portfolio:read       # View portfolio data
portfolio:write      # Modify portfolio
trade:execute        # Place trades
trade:read           # View trade history
watchlist:manage     # Full CRUD on watchlists
market:read          # View market data
org:invite           # Invite members to org
user:delete          # Delete user accounts
```

## Invalid Examples
```
portfolio.read       # No dots — use colon
Portfolio:Read       # No uppercase
trade:execute-order  # No hyphens in action
admin:*              # No wildcards (Phase 1)
portfolio:readWrite  # No camelCase — separate into two permissions
```

## Decision Process
1. **Identify the domain**: What resource area does this permission protect?
2. **Identify the action**: What operation is being performed? Use the simplest verb.
3. **Check if it already exists**: Don't create `portfolio:view` if `portfolio:read` exists.
4. **Prefer granular over broad**: `trade:execute` + `trade:read` is better than `trade:all`.
5. **Validate**: Run `isValidPermission('domain:action')` from `@heimdal/shared`.

## Assigning to Roles
Permissions are assigned to roles, not users directly. Users get permissions through their role assignments.
```
super-admin  → inherits everything
org-admin    → inherits from super-admin (all)
app-admin    → portfolio:read, portfolio:write, trade:execute, trade:read, watchlist:manage
user         → portfolio:read, trade:execute, trade:read, watchlist:manage
viewer       → portfolio:read, market:read
```
