import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        deco: {
          bg: 'rgb(var(--color-bg) / <alpha-value>)',
          surface: 'rgb(var(--color-surface) / <alpha-value>)',
          'surface-hover': 'rgb(var(--color-surface-hover) / <alpha-value>)',
          raised: 'rgb(var(--color-raised) / <alpha-value>)',
          sidebar: 'rgb(var(--color-sidebar) / <alpha-value>)',
          amber: 'rgb(var(--color-amber) / <alpha-value>)',
          'amber-dim': 'rgb(var(--color-amber-dim) / <alpha-value>)',
          copper: 'rgb(var(--color-copper) / <alpha-value>)',
          teal: 'rgb(var(--color-teal) / <alpha-value>)',
          green: 'rgb(var(--color-green) / <alpha-value>)',
          red: 'rgb(var(--color-red) / <alpha-value>)',
          purple: 'rgb(var(--color-purple) / <alpha-value>)',
          text: 'rgb(var(--color-text) / <alpha-value>)',
          'text-soft': 'rgb(var(--color-text-soft) / <alpha-value>)',
          'text-dim': 'rgb(var(--color-text-dim) / <alpha-value>)',
          'text-copper': 'rgb(var(--color-text-copper) / <alpha-value>)',
          border: 'rgb(var(--color-border) / <alpha-value>)',
          'border-copper': 'rgb(var(--color-border-copper) / <alpha-value>)',
          'border-dim': 'rgb(var(--color-border-dim) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'deco-card': 'var(--shadow-card)',
        'deco-modal': 'var(--shadow-modal)',
        'deco-glow': 'var(--shadow-glow)',
      },
      letterSpacing: {
        'deco-tight': '0.04em',
        'deco-wide': '0.08em',
        'deco-wider': '0.14em',
        'deco-widest': '0.2em',
      },
    },
  },
  plugins: [],
} satisfies Config;
