# How to Make a Reusable Component

## Design Principles

### 1. Variant-Driven, Not Feature-Driven
```typescript
// Good: one Button with variants
<Button variant="amber">Create</Button>
<Button variant="danger" small>Delete</Button>
<Button variant="ghost">Cancel</Button>

// Bad: three separate buttons
<AmberButton>Create</AmberButton>
<DangerButton>Delete</DangerButton>
<GhostButton>Cancel</GhostButton>
```

### 2. Props Are the API
Design props like a public API — clear names, sensible defaults, minimal required props.

```typescript
interface ButtonProps {
  children: ReactNode;           // Required: what's inside
  variant?: 'amber' | 'teal' | 'danger' | 'ghost';  // Default: 'ghost'
  small?: boolean;               // Default: false
  full?: boolean;                // Full-width. Default: false
  onClick?: () => void;          // Optional handler
}
```

### 3. Theme Consumption, Not Color Props
```typescript
// Good: uses theme tokens internally
function Badge({ variant = 'muted', children }: BadgeProps) {
  const t = useTheme();
  const colors = { green: t.green, red: t.red, amber: t.amber }[variant];
  return <span style={{ color: colors, ... }}>{children}</span>;
}

// Bad: accepts raw colors
<Badge color="#34D399" bg="rgba(52,211,153,0.12)">OK</Badge>
```

### 4. Composition Over Configuration
If a component needs 10+ props, it's trying to do too much. Split into composable pieces.
```typescript
// Good: composable
<Card>
  <Card.Title accent={t.amber}>Guard Calls</Card.Title>
  <Card.Body>
    <BarChart data={data} />
  </Card.Body>
</Card>

// Bad: mega-prop component
<Card title="Guard Calls" accent={t.amber} chart={data} chartType="bar" showLegend ... />
```

### 5. Forward Styles, Don't Block Them
Allow `style` and `className` overrides for edge cases, but don't rely on them.
```typescript
function Card({ children, style, ...props }: CardProps) {
  const t = useTheme();
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, ...style }}>
      {children}
    </div>
  );
}
```

## Checklist
- [ ] Works with both dark and light theme
- [ ] Has sensible defaults for all optional props
- [ ] No domain-specific knowledge (doesn't know about "orgs" or "roles")
- [ ] Props interface is exported
- [ ] Can be rendered in isolation without context (except theme)
