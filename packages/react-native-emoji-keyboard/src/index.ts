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

// --- quick-reaction row --------------------------------------------------
export { ReactionStrip } from './components/ReactionStrip';
export type { ReactionStripProps } from './components/ReactionStrip';

// --- bottom-sheet surface ------------------------------------------------
export { EmojiModal } from './components/EmojiModal';
export type { EmojiModalProps } from './components/EmojiModal';

// --- rich-media (sticker / GIF) provider API + panel (§7) ----------------
export { MediaGrid, MediaPanel } from './components/Media';
export type { MediaGridProps, MediaPanelProps } from './components/Media';
export { useMediaSearch, mediaPreviewUri } from './core';
export type {
  MediaItem,
  MediaProvider,
  MediaQueryOptions,
  MediaSearchState,
  UseMediaSearchOptions,
} from './core';

// --- composable headless primitives (§5 · frimousse parity) --------------
export {
  EmojiPicker,
  EmojiPickerRoot,
  EmojiPickerSearch,
  EmojiPickerViewport,
  EmojiPickerList,
  EmojiPickerEmpty,
  EmojiPickerLoading,
  EmojiPickerSkinToneSelector,
  useActiveEmoji,
  usePickerSkinTone,
} from './components/EmojiPicker';
export type {
  EmojiPickerRootProps,
  EmojiPickerSearchProps,
  EmojiPickerSearchRenderProps,
  EmojiPickerViewportProps,
  EmojiPickerListProps,
  EmojiPickerListComponents,
  EmojiPickerCategoryHeaderProps,
  EmojiPickerRowProps,
  EmojiPickerEmojiProps,
  EmojiPickerEmptyProps,
  EmojiPickerLoadingProps,
  ActiveEmoji,
  EmojiPickerStateOptions,
  EmojiPickerContextValue,
} from './components/EmojiPicker';

// --- device keyboard-height helpers (seamless keyboard-avoidance) --------
export { useKeyboardHeight } from './components/useKeyboardHeight';
export {
  useKeyboardState,
  useEmojiKeyboardInset,
  useEmojiKeyboardSwap,
} from './components/useKeyboardState';
export type { KeyboardState, EmojiKeyboardSwap } from './components/useKeyboardState';

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

// --- i18n · bundled locale label packs (§1) ------------------------------
export { AVAILABLE_LOCALES, getLocalePack, resolveTranslation } from './i18n';

// --- theming -------------------------------------------------------------
export { defaultTheme, darkTheme } from './theme';

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
  filterByEmojiVersion,
  resolveReaction,
  DEFAULT_QUICK_REACTIONS,
  useReactionHistory,
  readAdapter,
  writeAdapter,
  // §4 keyboard grid-navigation (pure movement model)
  nextGridFocus,
  firstGridFocus,
  lastGridFocus,
  normalizeFocus,
  emojiAtFocus,
  isGridNavKey,
  // hooks
  useReveal,
  useRecents,
  useFavorites,
  useFrequentlyUsed,
  useSkinTone,
  useMultiSelect,
  useSearch,
  useEmojiData,
  useCategorySync,
  useGridNavigation,
  // §8 async / lazy data loading
  useAsyncEmojiData,
  // image-backed emoji (bundled glyph set / custom / animated)
  twemojiUrl,
  toCodePoints,
  resolveEmojiImageUri,
  twemojiImageResolver,
  createTwemojiResolver,
  // category-swipe stepping
  adjacentCategory,
  // web render-support detection
  createEmojiSupportChecker,
  useEmojiSupport,
} from './core';

export type {
  GridItem,
  GridModel,
  RenderEmoji,
  Section,
  GridFocus,
  GridNavKey,
  GridNavModifiers,
  UseGridNavigation,
  EmojiSource,
  AsyncEmojiData,
  EmojiImageResolver,
  TwemojiUrlOptions,
} from './core';
