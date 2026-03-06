# ADR-005: Permission Naming Convention

**Status:** Accepted (Locked)
**Date:** 2026-03-03
**Decision Makers:** Andy (Architect)

## Context

Permissions need a consistent, predictable naming scheme across all Thimple applications. The guard service matches permission keys against access bindings.

## Decision

Use **`domain:action`** format. Both segments are lowercase alphabetic only.

**Pattern:** `/^[a-z]+:[a-z]+$/`

## Examples

```
portfolio:read       — View holdings and value
portfolio:write      — Modify portfolio
trade:execute        — Execute buy/sell paper trades
trade:read           — View trade history
watchlist:read       — View watchlist
watchlist:manage     — Add/remove stocks
market:read          — Access market data
```

## Rationale

- Simple, readable, and greppable
- Enforced at creation time — invalid patterns rejected
- Maps cleanly to API resources and UI capabilities
- No nesting — keeps resolution logic simple

## Consequences

- No hierarchical permissions (e.g., `portfolio:*`) in Phase 1
- Wildcard matching deferred — can be added later
- New domains require no schema changes, just new permission entries

## Reversibility

**No.** Changing the naming convention requires migrating all existing permissions and access bindings. The pattern is locked.
