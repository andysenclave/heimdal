# When a Component Goes in `common/`

## The Decision
A component belongs in `common/` when it is **reusable, stateless, and context-free**.

## Checklist — ALL must be true:
- [ ] It renders based ONLY on its props (no internal API calls)
- [ ] It has no knowledge of what page or feature it's used in
- [ ] It could be used in 2+ different pages without modification
- [ ] It manages no global state (no context consumers except theme)
- [ ] It's a UI primitive or a thin composition of primitives

## Examples That Belong in `common/`
```
common/
├── button.tsx          # Variants: amber, teal, danger, ghost
├── badge.tsx           # Status pills: green, red, amber, muted
├── card.tsx            # Container with accent, title, corner decorations
├── stat-card.tsx       # Label + big number + icon
├── table.tsx           # Table shell + header row
├── table-row.tsx       # Single data row
├── input.tsx           # Label + input + hint + dropdown indicator
├── select.tsx          # Styled dropdown
├── modal.tsx           # Overlay + modal container
├── separator.tsx       # Deco diamond divider
└── pill.tsx            # Filterable tab pill
```

## Examples That Do NOT Belong in `common/`
- `OrgTable` — knows about organization data shape → `sections/`
- `DashboardPage` — owns state and data fetching → `pages/`
- `GuardTrace` — specific to guard feature → `sections/`
- `RoleTreeNode` — coupled to role hierarchy logic → `sections/`

## The Litmus Test
> "If I delete every page and section, does this component still make sense on its own?"

Yes → `common/`. No → it belongs somewhere more specific.
