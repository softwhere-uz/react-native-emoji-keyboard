/**
 * Headless brain for the composable `EmojiPicker.*` primitives (§5 · frimousse
 * parity). Everything here is pure React (`react` only) — the context, the
 * state hook that wires every existing core hook together, and the parity hooks
 * (`useActiveEmoji`, `usePickerSkinTone`). The React-Native primitive components
 * (`components/EmojiPicker/*`) only read this context and render; all the logic
 * lives — and is unit-tested — here, exactly as a browser would drive it.
 */
import * as React from 'react';
import { applyTone, toEmojiType } from './skinTone';
import { useSearch } from './useSearch';
import { useRecents } from './useRecents';
import { useFavorites } from './useFavorites';
import { useSkinTone } from './useSkinTone';
import { useEmojiData } from './useEmojiData';
import { useGridNavigation, type UseGridNavigation } from './useGridNavigation';
import { useAsyncEmojiData, type EmojiSource } from './useAsyncEmojiData';
import { resolveTranslation } from '../i18n';
import type { GridModel, RenderEmoji, Section } from './internal-types';
import type { CompactEmoji } from '../data';
import type { CategoryTypes, EmojiType, SkinTone, StorageAdapter } from '../types';

/** The active (hovered / keyboard-focused) emoji, in frimousse's shape. */
export type ActiveEmoji = {
  /** The resolved glyph. */
  emoji: string;
  /** The human-readable name (for a preview/tooltip bar). */
  label: string;
  /** The underlying render record (glyph + source), for richer consumers. */
  render: RenderEmoji;
};

/** Options accepted by `EmojiPicker.Root` and {@link useEmojiPickerValue}. */
export type EmojiPickerStateOptions = {
  /** Called with an incumbent-compatible payload when an emoji is chosen. */
  onEmojiSelect: (emoji: EmojiType) => void;
  /** Fixed column count. Omit to let the List report its measured columns. */
  columns?: number;
  /** Controlled skin tone. Omit for internal (optionally persisted) state. */
  skinTone?: SkinTone;
  /** Initial skin tone when uncontrolled. Defaults to `'none'`. */
  defaultSkinTone?: SkinTone;
  /** Notified whenever the skin tone changes (controlled or not). */
  onSkinToneChange?: (tone: SkinTone) => void;
  /** Hide emoji newer than this Emoji spec version (tofu-gating). */
  emojiVersion?: number;
  /** Pluggable/async emoji source (§8). Omit for the bundled Emoji 17.0 set. */
  emojiSource?: EmojiSource;
  /** Explicit category order. */
  categoryOrder?: CategoryTypes[];
  /** Categories to hide. */
  disabledCategories?: CategoryTypes[];
  /** Per-emoji include predicate (memoize it). */
  shouldInclude?: (emoji: CompactEmoji) => boolean;
  /** Localized category / search labels (merged over any `locale` pack). */
  translation?: Partial<Record<CategoryTypes, string>>;
  /** BCP-47-ish locale code selecting a bundled category-label pack. */
  locale?: string;
  /** Storage adapter for recents / favorites / tone memory. */
  storage?: StorageAdapter;
  /** Show a leading recently-used section. */
  enableRecentlyUsed?: boolean;
  /** Show a leading favorites section + long-press favoriting. */
  enableFavorites?: boolean;
};

/** Everything the `EmojiPicker.*` primitives read from context. */
export type EmojiPickerContextValue = {
  columns: number;
  setColumns: (columns: number) => void;
  grid: GridModel;
  sections: Section[];
  loading: boolean;
  error: unknown;
  query: string;
  setQuery: (query: string) => void;
  isSearching: boolean;
  /** True while searching AND nothing matched (drives `EmojiPicker.Empty`). */
  isEmpty: boolean;
  skinTone: SkinTone;
  setSkinTone: (tone: SkinTone) => void;
  toneMemory: Readonly<Record<string, SkinTone>>;
  activeEmoji: ActiveEmoji | null;
  setActiveEmoji: (emoji: RenderEmoji | null) => void;
  select: (emoji: RenderEmoji) => void;
  isFavorite: (glyph: string) => boolean;
  toggleFavorite: (emoji: RenderEmoji) => void;
  nav: UseGridNavigation;
  translation: Partial<Record<CategoryTypes, string>> | undefined;
};

const EmojiPickerContext = React.createContext<EmojiPickerContextValue | null>(null);

/** Read the picker context; throws if used outside an `EmojiPicker.Root`. */
export function useEmojiPickerContext(): EmojiPickerContextValue {
  const ctx = React.useContext(EmojiPickerContext);
  if (!ctx) {
    throw new Error(
      'EmojiPicker.* components and hooks must be used inside an <EmojiPicker.Root>.'
    );
  }
  return ctx;
}

/** frimousse-parity: the emoji currently under the pointer/keyboard, or `null`. */
export function useActiveEmoji(): ActiveEmoji | null {
  return useEmojiPickerContext().activeEmoji;
}

/** frimousse-parity: `[skinTone, setSkinTone]` for a custom tone selector. */
export function usePickerSkinTone(): [SkinTone, (tone: SkinTone) => void] {
  const { skinTone, setSkinTone } = useEmojiPickerContext();
  return [skinTone, setSkinTone];
}

/**
 * The state hook behind `EmojiPicker.Root`. Wires the async source, search,
 * skin tone, recents/favorites, the data→grid transform, and keyboard focus
 * into one context value. Returned separately (not just via the provider) so it
 * is unit-testable in isolation.
 */
export function useEmojiPickerValue(opts: EmojiPickerStateOptions): EmojiPickerContextValue {
  const {
    onEmojiSelect,
    columns: fixedColumns,
    skinTone: controlledTone,
    defaultSkinTone = 'none',
    onSkinToneChange,
    emojiVersion,
    emojiSource,
    categoryOrder,
    disabledCategories,
    shouldInclude,
    translation,
    locale,
    storage,
    enableRecentlyUsed = false,
    enableFavorites = false,
  } = opts;

  // Bundled locale label pack merged under any explicit `translation`.
  const resolvedTranslation = React.useMemo(
    () => resolveTranslation(locale, translation),
    [locale, translation]
  );

  // §8: resolve the (possibly async) bundle.
  const { emojis: sourceEmojis, loading, error } = useAsyncEmojiData(emojiSource);

  // Columns: fixed by prop, else measured and reported by the List.
  const [autoColumns, setAutoColumns] = React.useState(fixedColumns ?? 8);
  const columns = fixedColumns ?? autoColumns;
  const setColumns = React.useCallback(
    (n: number) => {
      if (fixedColumns == null && n > 0) setAutoColumns(n);
    },
    [fixedColumns]
  );

  // Skin tone: internal (optionally persisted) global tone + per-emoji memory,
  // overridable by a controlled `skinTone` prop.
  const {
    skinTone: internalTone,
    setSkinTone: setInternalTone,
    toneMemory,
    rememberTone,
  } = useSkinTone({ storage, defaultTone: defaultSkinTone });
  const skinTone = controlledTone ?? internalTone;
  const setSkinTone = React.useCallback(
    (tone: SkinTone) => {
      if (controlledTone == null) setInternalTone(tone);
      onSkinToneChange?.(tone);
    },
    [controlledTone, setInternalTone, onSkinToneChange]
  );

  // Recents + favorites.
  const { recents, addRecent } = useRecents({ storage, enabled: enableRecentlyUsed });
  const { favorites, toggleFavorite: toggleFav, isFavorite } = useFavorites({
    storage,
    enabled: enableFavorites,
  });

  // Search over the active bundle.
  const { query, setQuery, results } = useSearch(sourceEmojis as CompactEmoji[]);
  const isSearching = query.trim().length > 0;

  const { grid, sections } = useEmojiData({
    categoryOrder: categoryOrder ? [...categoryOrder] : undefined,
    disabledCategories,
    enableFavorites,
    favorites,
    enableRecentlyUsed,
    recents,
    skinTone,
    toneMemory,
    numColumns: columns,
    searchResults: isSearching ? results : null,
    translation: resolvedTranslation,
    maxEmojiVersion: emojiVersion,
    shouldInclude,
    emojiSource: sourceEmojis,
  });

  const isEmpty = isSearching && grid.items.every((item) => item.type !== 'row');

  // Keyboard focus over the grid.
  const nav = useGridNavigation(grid);

  // Active (hover/focus) emoji: pointer sets it directly; keyboard nav syncs it.
  const [pointerActive, setPointerActive] = React.useState<RenderEmoji | null>(null);
  const setActiveEmoji = React.useCallback((emoji: RenderEmoji | null) => {
    setPointerActive(emoji);
  }, []);
  const activeRender = nav.activeEmoji ?? pointerActive;
  const activeEmoji = React.useMemo<ActiveEmoji | null>(
    () =>
      activeRender
        ? { emoji: activeRender.glyph, label: activeRender.source.n, render: activeRender }
        : null,
    [activeRender]
  );

  const select = React.useCallback(
    (emoji: RenderEmoji) => {
      const payload = toEmojiType(emoji.source, emoji.glyph);
      if (enableRecentlyUsed) addRecent(payload);
      onEmojiSelect(payload);
    },
    [enableRecentlyUsed, addRecent, onEmojiSelect]
  );

  const toggleFavorite = React.useCallback(
    (emoji: RenderEmoji) => {
      toggleFav(toEmojiType(emoji.source, emoji.glyph));
    },
    [toggleFav]
  );

  // Keep `rememberTone` referenced so a future per-emoji tone flow can call it
  // without re-plumbing; not part of the public value yet.
  void rememberTone;
  void applyTone;

  return React.useMemo<EmojiPickerContextValue>(
    () => ({
      columns,
      setColumns,
      grid,
      sections,
      loading,
      error,
      query,
      setQuery,
      isSearching,
      isEmpty,
      skinTone,
      setSkinTone,
      toneMemory,
      activeEmoji,
      setActiveEmoji,
      select,
      isFavorite,
      toggleFavorite,
      nav,
      translation: resolvedTranslation,
    }),
    [
      columns,
      setColumns,
      grid,
      sections,
      loading,
      error,
      query,
      setQuery,
      isSearching,
      isEmpty,
      skinTone,
      setSkinTone,
      toneMemory,
      activeEmoji,
      setActiveEmoji,
      select,
      isFavorite,
      toggleFavorite,
      nav,
      resolvedTranslation,
    ]
  );
}

/** Runs {@link useEmojiPickerValue} and provides it to descendants. */
export function EmojiPickerStateProvider(
  props: EmojiPickerStateOptions & { children: React.ReactNode }
): React.ReactElement {
  const { children, ...opts } = props;
  const value = useEmojiPickerValue(opts);
  return <EmojiPickerContext.Provider value={value}>{children}</EmojiPickerContext.Provider>;
}
