/**
 * Bundled, compact Emoji 17.0 dataset (English).
 *
 * The files under `./generated` are produced by `scripts/codegen.mjs` from
 * `emojibase-data` and are checked in. Regenerate with `yarn codegen`.
 *
 * This data ships *inside* the library (single package). A new Unicode version
 * is therefore a library release: bump `emojibase-data`, run `yarn codegen`,
 * and publish.
 */
import emojis from './generated/en';
import groups from './generated/groups';
import meta from './generated/meta';

export type { CompactEmoji, EmojiGroup, EmojiMeta } from './types';

/** The full English emoji bundle, sorted by group then canonical order. */
export { emojis };
/** Picker categories present in the bundle, in display order. */
export { groups };
/** Bundle provenance (emoji version, locale, count). */
export { meta };
