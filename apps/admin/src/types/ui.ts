import type { ReactNode } from 'react';

export type DecoVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type DecoSize = 'sm' | 'md';
export type BadgeVariant = 'green' | 'red' | 'amber' | 'purple' | 'teal' | 'muted';

export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}
