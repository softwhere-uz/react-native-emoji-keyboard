/**
 * Quick-reaction helpers. Pure — no React, no `react-native`.
 *
 * Resolves a reaction glyph to a full `EmojiType` (for `onEmojiSelected`
 * parity) using the bundled data, tolerant to emoji-presentation variation
 * selectors (`U+FE0F`) so clean literals like `'👍'` match a stored `'👍️'`.
 */
import { emojis } from '../data';
import type { CompactEmoji } from '../data';
import type { EmojiType } from '../types';
import { toEmojiType } from './skinTone';

/** Common chat quick-reactions, in display order. */
export const DEFAULT_QUICK_REACTIONS: readonly string[] = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

/** Drop emoji-presentation variation selectors for tolerant glyph matching. */
function stripVariationSelectors(glyph: string): string {
  return glyph.replace(/️/g, '');
}

// Index the bundle by exact glyph AND by its variation-selector-stripped form
// (first writer wins, i.e. the canonical CLDR-ordered record).
const BY_GLYPH = new Map<string, CompactEmoji>();
for (const e of emojis) {
  if (!BY_GLYPH.has(e.e)) BY_GLYPH.set(e.e, e);
  const bare = stripVariationSelectors(e.e);
  if (!BY_GLYPH.has(bare)) BY_GLYPH.set(bare, e);
}

/**
 * Resolve `glyph` to a full `EmojiType`. The returned `emoji` is the passed
 * glyph exactly as displayed; `name` / `slug` / `unicode_version` / `toneEnabled`
 * come from the bundle when the glyph is found, else a minimal fallback.
 */
export function resolveReaction(glyph: string): EmojiType {
  const match = BY_GLYPH.get(glyph) ?? BY_GLYPH.get(stripVariationSelectors(glyph));
  if (match) return toEmojiType(match, glyph);
  return { emoji: glyph, name: glyph, slug: '', unicode_version: '', toneEnabled: false };
}
