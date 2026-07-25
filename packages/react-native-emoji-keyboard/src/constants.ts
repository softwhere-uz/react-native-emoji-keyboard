/**
 * Shared, frozen constants: category ordering, group↔category mapping, and the
 * canonical skin-tone ordering. Kept in one place so every module agrees.
 */
import type { CategoryTypes, SkinTone } from './types';

/**
 * Maps an emoji-data group id (`CompactEmoji.g`) to a picker
 * `CategoryTypes`. Group 2 ("component") is intentionally absent.
 */
export const GROUP_ID_TO_CATEGORY: Readonly<Record<number, CategoryTypes>> = {
  0: 'smileys_emotion',
  1: 'people_body',
  3: 'animals_nature',
  4: 'food_drink',
  5: 'travel_places',
  6: 'activities',
  7: 'objects',
  8: 'symbols',
  9: 'flags',
};

/**
 * Default scroll/tab order. `recently_used` leads (shown only when
 * `enableRecentlyUsed`); `search` is a mode, not a scroll target, so it is absent.
 */
export const DEFAULT_CATEGORY_ORDER: readonly CategoryTypes[] = [
  'recently_used',
  'smileys_emotion',
  'people_body',
  'animals_nature',
  'food_drink',
  'travel_places',
  'activities',
  'objects',
  'symbols',
  'flags',
];

/** Fallback English labels for each category (used when no `translation` is given). */
export const DEFAULT_CATEGORY_LABELS: Readonly<Record<CategoryTypes, string>> = {
  recently_used: 'Recently used',
  smileys_emotion: 'Smileys & Emotion',
  people_body: 'People & Body',
  animals_nature: 'Animals & Nature',
  food_drink: 'Food & Drink',
  travel_places: 'Travel & Places',
  activities: 'Activities',
  objects: 'Objects',
  symbols: 'Symbols',
  flags: 'Flags',
  search: 'Search',
};

/**
 * Canonical tone ordering. Index `0..4` corresponds to `CompactEmoji.t`
 * (`[light, medium-light, medium, medium-dark, dark]`); `'none'` is the base glyph.
 */
export const SKIN_TONES: readonly SkinTone[] = [
  'none',
  'light',
  'medium-light',
  'medium',
  'medium-dark',
  'dark',
];

/** Storage keys used by the default persistence hooks. */
export const STORAGE_KEYS = {
  recents: '@softwhere-uz/emoji-keyboard:recents',
  skinTone: '@softwhere-uz/emoji-keyboard:skin-tone',
  skinToneMemory: '@softwhere-uz/emoji-keyboard:skin-tone-memory',
} as const;

/** Default number of recently-used emoji to retain. */
export const DEFAULT_RECENTS_LIMIT = 24;

/** Default emoji glyph font size (px) when `emojiSize` is not provided. */
export const DEFAULT_EMOJI_SIZE = 28;
