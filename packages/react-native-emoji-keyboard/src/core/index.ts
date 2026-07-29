/**
 * Barrel for the headless core: pure logic + hooks, all platform-agnostic
 * (safe on web, unit-testable in jsdom). No `react-native` imports here or in
 * any re-exported module.
 */

// Internal model types.
export type { GridItem, GridModel, RenderEmoji, Section } from './internal-types';

// Pure functions.
export { toneIndex, applyTone, slugify, toEmojiType, skinToneVariations } from './skinTone';
export type { SkinToneVariation } from './skinTone';
export { createEmojiDatabase } from './database';
export type { EmojiDatabase } from './database';
export { buildGrid } from './buildGrid';
export { searchEmojis } from './search';
export { searchByShortcodePrefix } from './shortcodeSearch';
export { filterByEmojiVersion } from './version';
export { resolveReaction, DEFAULT_QUICK_REACTIONS } from './reactions';
export { useReactionHistory } from './useReactionHistory';
export type { ReactionHistoryMode } from './useReactionHistory';
export { createMemoryAdapter, readAdapter, writeAdapter } from './adapters';
export {
  toCodePoints,
  twemojiUrl,
  resolveEmojiImageUri,
  twemojiImageResolver,
  createTwemojiResolver,
} from './emojiImage';
export type { EmojiImageResolver, TwemojiUrlOptions } from './emojiImage';
export { adjacentCategory } from './categoryNav';
export {
  pixelsDiffer,
  hasInk,
  createEmojiSupportChecker,
  useEmojiSupport,
} from './renderSupport';
export type { EmojiSupportChecker } from './renderSupport';
export { useMediaSearch, mediaPreviewUri } from './media';
export type {
  MediaItem,
  MediaProvider,
  MediaQueryOptions,
  MediaSearchState,
  UseMediaSearchOptions,
} from './media';
export {
  nextGridFocus,
  firstGridFocus,
  lastGridFocus,
  normalizeFocus,
  emojiAtFocus,
  isGridNavKey,
} from './gridNavigation';
export type { GridFocus, GridNavKey, GridNavModifiers } from './gridNavigation';

// Hooks.
export { useReveal } from './useReveal';
export { useRecents } from './useRecents';
export { useFavorites } from './useFavorites';
export { useFrequentlyUsed } from './useFrequentlyUsed';
export type { FrequentMode } from './useFrequentlyUsed';
export { useSkinTone } from './useSkinTone';
export { useMultiSelect } from './useMultiSelect';
export { useSearch } from './useSearch';
export { useEmojiData } from './useEmojiData';
export { useCategorySync } from './useCategorySync';
export { useGridNavigation } from './useGridNavigation';
export type { UseGridNavigation } from './useGridNavigation';
export { useAsyncEmojiData } from './useAsyncEmojiData';
export type { EmojiSource, AsyncEmojiData } from './useAsyncEmojiData';
export {
  useEmojiPickerValue,
  useEmojiPickerContext,
  useActiveEmoji,
  usePickerSkinTone,
  EmojiPickerStateProvider,
} from './emojiPickerContext';
export type {
  EmojiPickerStateOptions,
  EmojiPickerContextValue,
  ActiveEmoji,
} from './emojiPickerContext';
