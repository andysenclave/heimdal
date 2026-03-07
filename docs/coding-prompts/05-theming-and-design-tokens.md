# Theming and Design Tokens

## Token Architecture
All visual decisions flow from a single token object. Never hardcode colors, fonts, or shadows.

```
tokens/
├── dark.ts       # Dark theme token values
├── light.ts      # Light theme token values
├── types.ts      # ThemeTokens interface
└── context.tsx    # React context + useTheme() hook
```

## Token Categories
```typescript
interface ThemeTokens {
  mode: 'dark' | 'light';

  // Surfaces (background layers, darkest → lightest)
  bg: string;          // App background
  surface: string;     // Card/panel background
  surfaceHover: string;
  raised: string;      // Elevated elements (inputs, dropdowns)

  // Semantic colors (each has a `Dim` variant for backgrounds)
  amber: string;       // Primary brand accent
  teal: string;        // Secondary accent
  green: string;       // Success / allowed
  red: string;         // Error / denied
  purple: string;      // Info / roles

  // Text hierarchy
  text: string;        // Primary content
  textSoft: string;    // Secondary content
  textDim: string;     // Tertiary / placeholders

  // Borders (3 levels)
  border: string;      // Default
  borderDim: string;   // Subtle
  borderCopper: string;// Accent border

  // Typography stacks
  display: string;     // Headings
  sans: string;        // Body
  mono: string;        // Code, data, numbers
}
```

## How Components Consume Tokens
```typescript
function MyComponent() {
  const t = useTheme(); // Never import tokens directly

  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      color: t.text,
      fontFamily: t.mono,
    }}>
      <span style={{ color: t.amber }}>{value}</span>
    </div>
  );
}
```

## Rules
- **Never hardcode** a hex color in a component. Always use `t.{token}`.
- **Dim variants** = the color at low opacity, for backgrounds. `t.greenDim` behind a success badge.
- **Font stacks**: `display` for headings, `sans` for body, `mono` for data/numbers/code.
- **Shadows** change between themes: dark uses deep shadows, light uses subtle ones.
- **Theme toggle** lives in the top bar. Theme state is in the root component, passed via context.
- When adding a new semantic color, add it to BOTH `dark.ts` and `light.ts`.
