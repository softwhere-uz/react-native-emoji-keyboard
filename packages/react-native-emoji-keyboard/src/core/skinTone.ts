/**
 * Skin-tone resolution + `EmojiType` construction. Pure functions, no React.
 *
 * `CompactEmoji.t` (when present) holds exactly five tone glyphs ordered
 * `[light, medium-light, medium, medium-dark, dark]`, matching indices `0..4`
 * of `SKIN_TONES` after dropping the leading `'none'`.
 */
import type { CompactEmoji } from '../data';
import { SKIN_TONES } from '../constants';
import type { EmojiType, SkinTone } from '../types';

/**
 * Map a `SkinTone` to its index into `CompactEmoji.t` (`0..4`), or `-1` for
 * `'none'` / any unknown tone (i.e. use the base glyph).
 */
export function toneIndex(tone: SkinTone): number {
  // SKIN_TONES[0] is 'none'; tone glyphs live at t[0..4] → shift by one.
  const pos = SKIN_TONES.indexOf(tone);
  return pos <= 0 ? -1 : pos - 1;
}

/**
 * Resolve the glyph for `e` under `tone`. Returns the tone variant only when
 * the emoji actually supports five tones and the index is in range; otherwise
 * falls back to the base glyph `e.e`.
 */
export function applyTone(e: CompactEmoji, tone: SkinTone): string {
  const idx = toneIndex(tone);
  if (idx < 0) return e.e;
  const tones = e.t;
  if (!Array.isArray(tones) || tones.length < 5) return e.e;
  const toned = tones[idx];
  return typeof toned === 'string' && toned.length > 0 ? toned : e.e;
}

/**
 * Incumbent-compatible slug: lowercase, every run of non-alphanumeric
 * characters collapsed to a single `_`, with leading/trailing `_` trimmed.
 * E.g. `"grinning face"` → `"grinning_face"`, `"family: man, woman"` →
 * `"family_man_woman"`.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Format an emoji spec version as an incumbent-style dotted string: integer
 * versions gain a `.0` (`1` → `"1.0"`, `15` → `"15.0"`); fractional versions
 * (`0.6`) are kept as-is; absent versions become `""`.
 */
function formatUnicodeVersion(v: number | undefined): string {
  if (v == null) return '';
  return Number.isInteger(v) ? `${v}.0` : String(v);
}

/**
 * Build the public `EmojiType` payload delivered to `onEmojiSelected`.
 * `glyph` is the already-tone-resolved glyph (see {@link applyTone}).
 */
export function toEmojiType(
  e: CompactEmoji,
  glyph: string,
  extra?: { alreadySelected?: boolean }
): EmojiType {
  return {
    emoji: glyph,
    name: e.n,
    slug: slugify(e.n),
    unicode_version: formatUnicodeVersion(e.v),
    toneEnabled: Array.isArray(e.t) && e.t.length >= 5,
    alreadySelected: extra?.alreadySelected,
  };
}
