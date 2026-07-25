/**
 * Deep-merge helpers for resolving partial `theme` / `styles` overrides against
 * a fully-populated base. Objects are merged recursively; scalars (and style
 * values) are overridden; `undefined` overrides are ignored. No dependencies.
 */
import type { RecursivePartial, Styles, Theme } from '../types';

/** True for a plain, mergeable object (not an array, not null). */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Recursively merge `override` onto `base`, returning a new object. Nested plain
 * objects are merged key-by-key; every other value (scalar/array) from
 * `override` replaces the base value. `undefined` overrides are skipped so a
 * partial object never clears a base value.
 */
function deepMerge<T>(base: T, override: RecursivePartial<T> | undefined): T {
  if (override === undefined) return base;
  if (!isPlainObject(base) || !isPlainObject(override)) {
    // At a leaf: an explicit override replaces the base.
    return override as unknown as T;
  }

  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    const overrideValue = (override as Record<string, unknown>)[key];
    if (overrideValue === undefined) continue;
    const baseValue = (base as Record<string, unknown>)[key];
    result[key] = deepMerge(baseValue as unknown, overrideValue as RecursivePartial<unknown>);
  }
  return result as T;
}

/** Resolve a partial `Theme` override against a complete base theme. */
export function mergeTheme(base: Theme, override?: RecursivePartial<Theme>): Theme {
  return deepMerge(base, override);
}

/** Resolve a partial `Styles` override against a complete base styles object. */
export function mergeStyles(base: Styles, override?: RecursivePartial<Styles>): Styles {
  return deepMerge(base, override);
}
