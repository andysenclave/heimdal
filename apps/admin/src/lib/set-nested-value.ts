/**
 * Sets a value at a dot-separated key path within a nested object.
 * Mutates the object in place — pass a deep clone if immutability is needed.
 */
export function setNestedValue(obj: Record<string, unknown>, keyPath: string, value: string): void {
  const keys = keyPath.split('.');
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {};
    }
    current = current[keys[i]] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}
