import { describe, it, expect } from 'vitest';
import { setNestedValue } from '../set-nested-value';

describe('setNestedValue', () => {
  it('sets a top-level key', () => {
    const obj: Record<string, unknown> = {};
    setNestedValue(obj, 'title', 'Hello');
    expect(obj.title).toBe('Hello');
  });

  it('sets a nested key creating intermediate objects', () => {
    const obj: Record<string, unknown> = {};
    setNestedValue(obj, 'hero.heading', 'Welcome');
    expect((obj.hero as Record<string, unknown>).heading).toBe('Welcome');
  });

  it('sets a deeply nested key', () => {
    const obj: Record<string, unknown> = {};
    setNestedValue(obj, 'section.card.title', 'Card Title');
    const section = obj.section as Record<string, unknown>;
    const card = section.card as Record<string, unknown>;
    expect(card.title).toBe('Card Title');
  });

  it('overwrites an existing value', () => {
    const obj: Record<string, unknown> = { title: 'Old' };
    setNestedValue(obj, 'title', 'New');
    expect(obj.title).toBe('New');
  });

  it('overwrites a non-object intermediate with an object', () => {
    const obj: Record<string, unknown> = { hero: 'string-value' };
    setNestedValue(obj, 'hero.heading', 'Welcome');
    expect((obj.hero as Record<string, unknown>).heading).toBe('Welcome');
  });

  it('preserves sibling keys in nested objects', () => {
    const obj: Record<string, unknown> = { hero: { heading: 'Hello', subtitle: 'World' } };
    setNestedValue(obj, 'hero.heading', 'Changed');
    const hero = obj.hero as Record<string, unknown>;
    expect(hero.heading).toBe('Changed');
    expect(hero.subtitle).toBe('World');
  });
});
