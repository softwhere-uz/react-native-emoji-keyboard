/**
 * Public entry point for `@softwhere-uz/react-native-emoji-keyboard`.
 *
 * Exposes the batteries-included inline `<EmojiKeyboard>` (named + default), the
 * `rn-emoji-keyboard`-compatible public types, the default theme, the in-memory
 * storage adapter, and the headless core hooks for advanced/custom UIs.
 */
import { EmojiKeyboard } from './components/EmojiKeyboard';

// --- component -----------------------------------------------------------
export { EmojiKeyboard };
export default EmojiKeyboard;

// --- public types (incumbent-compatible) ---------------------------------
export type {
  EmojiType,
  Theme,
  Styles,
  EmojiKeyboardProps,
  CategoryTypes,
  CategoryPosition,
  StorageAdapter,
  SkinTone,
  JsonEmoji,
  EmojisByCategory,
  RecursivePartial,
} from './types';

// --- bundled emoji data (Emoji 17.0) -------------------------------------
export { emojis, groups, meta } from './data';
export type { CompactEmoji, EmojiGroup, EmojiMeta } from './data';

// --- theming -------------------------------------------------------------
export { defaultTheme } from './theme';

// --- storage -------------------------------------------------------------
export { createMemoryAdapter } from './core';

// --- headless core (advanced users) --------------------------------------
export {
  // pure helpers
  applyTone,
  toneIndex,
  slugify,
  toEmojiType,
  buildGrid,
  searchEmojis,
  readAdapter,
  writeAdapter,
  // hooks
  useReveal,
  useRecents,
  useSkinTone,
  useSearch,
  useEmojiData,
  useCategorySync,
} from './core';

export type { GridItem, GridModel, RenderEmoji, Section } from './core';
