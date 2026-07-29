/**
 * Bundled locale packs (§1 · i18n) — authoritative CLDR category-label
 * translations for ~27 locales, generated from `emojibase-data` messages.
 *
 * Scope: **labels only**. The 9 real categories localize from CLDR; the virtual
 * `recently_used` / `favorites` / `search` labels fall back to English unless
 * the consumer overrides them via `translation`. Localized keyword *search* is a
 * separate (larger) feature and is intentionally not bundled here.
 */
import LOCALES from '../data/generated/locales';
import type { CategoryTypes } from '../types';

/** The BCP-47-ish locale codes that ship with a bundled label pack. */
export const AVAILABLE_LOCALES: readonly string[] = Object.keys(LOCALES).sort();

/**
 * Resolve a `locale` to its bundled category-label pack, or `undefined` if none
 * matches. Matching is case-insensitive and falls back from a region-qualified
 * tag to its base language: `es-ES` → `es`, `pt-BR` → `pt`, `zh-Hant` →
 * `zh-hant`.
 */
export function getLocalePack(
  locale: string | undefined
): Partial<Record<CategoryTypes, string>> | undefined {
  if (!locale) return undefined;
  const normalized = locale.toLowerCase().replace(/_/g, '-');
  const exact = LOCALES[normalized];
  if (exact) return exact;
  const base = normalized.split('-')[0];
  return base ? LOCALES[base] : undefined;
}

/**
 * Merge a bundled locale pack under an explicit `translation` override: the
 * pack provides the base labels, `translation` wins per key. Returns `undefined`
 * when neither is present (so callers can pass it straight through).
 */
export function resolveTranslation(
  locale: string | undefined,
  translation: Partial<Record<CategoryTypes, string>> | undefined
): Partial<Record<CategoryTypes, string>> | undefined {
  const pack = getLocalePack(locale);
  if (!pack) return translation;
  return translation ? { ...pack, ...translation } : pack;
}
