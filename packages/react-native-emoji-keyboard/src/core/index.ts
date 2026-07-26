/**
 * Barrel for the headless core: pure logic + hooks, all platform-agnostic
 * (safe on web, unit-testable in jsdom). No `react-native` imports here or in
 * any re-exported module.
 */

// Internal model types.
export type { GridItem, GridModel, RenderEmoji, Section } from './internal-types';

// Pure functions.
export { toneIndex, applyTone, slugify, toEmojiType } from './skinTone';
export { buildGrid } from './buildGrid';
export { searchEmojis } from './search';
export { filterByEmojiVersion } from './version';
export { createMemoryAdapter, readAdapter, writeAdapter } from './adapters';

// Hooks.
export { useReveal } from './useReveal';
export { useRecents } from './useRecents';
export { useSkinTone } from './useSkinTone';
export { useMultiSelect } from './useMultiSelect';
export { useSearch } from './useSearch';
export { useEmojiData } from './useEmojiData';
export { useCategorySync } from './useCategorySync';
