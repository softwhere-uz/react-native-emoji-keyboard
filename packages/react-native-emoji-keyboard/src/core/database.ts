/**
 * `createEmojiDatabase` — a small UI-agnostic query facade over an emoji bundle
 * (issue #10). Bundles the exported pure helpers (ranked search, `:shortcode:`
 * autocomplete, glyph→data lookup, skin-tone resolution) behind one object, so a
 * consumer can build a fully custom picker (or a non-visual integration) without
 * wiring each helper individually. Mirrors emoji-picker-element's separate
 * `Database` class. Pure — no React, no `react-native`.
 */
import { emojis as BUNDLED } from '../data';
import type { CompactEmoji } from '../data';
import type { EmojiType } from '../types';
import { searchEmojis } from './search';
import { searchByShortcodePrefix } from './shortcodeSearch';
import { applyTone, skinToneVariations, toEmojiType } from './skinTone';
import type { SkinTone } from '../types';
import type { SkinToneVariation } from './skinTone';

/** Strip variation selectors (U+FE00–U+FE0F) so a de-qualified glyph resolves. */
function stripVariationSelectors(glyph: string): string {
  return glyph.replace(/\uFE0F/g, '');
}

export type EmojiDatabase = {
  /** The full emoji list backing this database. */
  all: readonly CompactEmoji[];
  /** Ranked search over names / shortcodes / keywords / emoticons. */
  search: (query: string) => CompactEmoji[];
  /** Inline `:shortcode:` prefix autocomplete → `EmojiType[]`. */
  autocomplete: (query: string, opts?: { limit?: number; minChars?: number }) => EmojiType[];
  /** Resolve a rendered glyph back to its `EmojiType` (tolerant of VS16). */
  fromGlyph: (glyph: string) => EmojiType;
  /** The tone variants of an emoji, for a custom tone selector. */
  toneVariations: (emoji: CompactEmoji) => SkinToneVariation[];
  /** Resolve a glyph under a skin tone. */
  applyTone: (emoji: CompactEmoji, tone: SkinTone) => string;
};

/**
 * Build a database over `list` (defaults to the bundled Emoji 17.0 set). The
 * glyph index is built once for O(1) `fromGlyph`.
 */
export function createEmojiDatabase(list: readonly CompactEmoji[] = BUNDLED): EmojiDatabase {
  const byGlyph = new Map<string, CompactEmoji>();
  for (const e of list) {
    byGlyph.set(e.e, e);
    byGlyph.set(stripVariationSelectors(e.e), e);
  }

  return {
    all: list,
    search: (query) => searchEmojis(query, list as CompactEmoji[]),
    autocomplete: (query, opts) => searchByShortcodePrefix(query, list as CompactEmoji[], opts),
    fromGlyph: (glyph) => {
      const match = byGlyph.get(glyph) ?? byGlyph.get(stripVariationSelectors(glyph));
      return match
        ? toEmojiType(match, glyph)
        : { emoji: glyph, name: glyph, slug: '', unicode_version: '', toneEnabled: false };
    },
    toneVariations: (emoji) => skinToneVariations(emoji),
    applyTone: (emoji, tone) => applyTone(emoji, tone),
  };
}
