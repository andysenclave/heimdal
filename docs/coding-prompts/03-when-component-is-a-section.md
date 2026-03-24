# When a Component is a Section

## The Decision
A section is a **composed UI block** that combines common components into a meaningful feature chunk. It knows about a domain but does NOT own data fetching.

## How It Differs

| | Common | Section | Page |
|---|--------|---------|------|
| Knows about domain data? | No | Yes | Yes |
| Fetches data? | No | No | Yes |
| Composes other components? | Rarely | Always | Always |
| Reused across pages? | Yes | Sometimes | No |
| Has its own state? | Minimal | UI state only | All state |

## Examples That Are Sections
```
sections/
├── role-tree.tsx         # Visualizes role hierarchy (receives roles as props)
├── guard-trace.tsx       # Shows decision steps (receives trace as props)
├── org-member-list.tsx   # Member table for an org (receives members as props)
├── mini-bar-chart.tsx    # Chart with labels (receives data as props)
├── quick-actions.tsx     # Grid of action buttons (receives callbacks as props)
├── notification-list.tsx # Toggle switches for notification prefs
└── active-sessions.tsx   # Session list with revoke buttons
```

## Section Props Pattern
```typescript
// sections/guard-trace.tsx
interface GuardTraceProps {
  result: 'allowed' | 'denied' | null;
  steps: Array<{ step: string; detail: string; ok: boolean }>;
  decisionId?: string;
  latencyMs?: number;
}

function GuardTrace({ result, steps, decisionId, latencyMs }: GuardTraceProps) {
  // Composes Badge, Card — but ALL data comes from props
  return (
    <Card title="Decision Trace" accent={result === 'allowed' ? green : red}>
      {steps.map(s => (
        <div key={s.step}>
          <Badge variant={s.ok ? 'green' : 'red'}>{s.ok ? 'PASS' : 'FAIL'}</Badge>
          <span>{s.step}</span>
        </div>
      ))}
    </Card>
  );
}
```

## The Litmus Test
> "Does this compose common components around a specific domain concept, but still receive all its data via props?"

Yes → section. Fetches its own data → page. Has no domain knowledge → common.
