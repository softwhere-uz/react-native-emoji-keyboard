/**
 * Types for the bundled compact Emoji dataset.
 *
 * Records use short keys to keep the shipped bundle small (measured ~64 KB gzipped
 * for the full English set including keywords + shortcodes + tone glyphs).
 */

/** A single compact emoji record. */
export interface CompactEmoji {
  /** Fully-qualified emoji glyph, e.g. `"👋"`. */
  e: string;
  /** Primary English label, e.g. `"waving hand"`. */
  n: string;
  /**
   * emojibase group id. One of `0,1,3,4,5,6,7,8,9`.
   * Group `2` (skin-tone "component") and group-less regional indicators are excluded.
   */
  g: number;
  /** Canonical CLDR sort order within the full set. */
  o: number;
  /** Search keywords / tags (emojibase `tags`). Absent when empty. */
  k?: string[];
  /** Shortcodes (emojibase preset), e.g. `["wave"]`. Absent when none. */
  s?: string[];
  /** Emoji spec version this glyph was introduced in (for future tofu-gating). */
  v?: number;
  /**
   * Five single skin-tone variant glyphs, ordered
   * `[light, medium-light, medium, medium-dark, dark]`.
   * Present only when the emoji supports the five canonical tones.
   */
  t?: string[];
}

/** A picker category, derived from an emojibase group. */
export interface EmojiGroup {
  /** emojibase group id (matches `CompactEmoji.g`). */
  id: number;
  /** Stable slug, e.g. `"smileys-emotion"`. */
  key: string;
  /** Localized display label, e.g. `"smileys & emotion"`. */
  label: string;
  /** Display order (0-based, in the order groups appear in the bundle). */
  order: number;
}

/** Provenance / versioning metadata for the generated bundle. */
export interface EmojiMeta {
  /** Emoji spec version, e.g. `"17.0"`. */
  emojiVersion: string;
  /** Exact `emojibase-data` version the bundle was generated from, e.g. `"17.0.0"`. */
  sourceVersion?: string;
  /** CLDR release the labels came from, if known. */
  cldrVersion?: string;
  /** Locale of the labels/keywords, e.g. `"en"`. */
  locale: string;
  /** Number of emoji records in the bundle. */
  count: number;
}
