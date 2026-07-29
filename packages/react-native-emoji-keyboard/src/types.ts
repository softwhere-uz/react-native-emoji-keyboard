/**
 * Public type contract for `@softwhere-uz/react-native-emoji-keyboard`.
 *
 * This mirrors the shapes of the incumbent `rn-emoji-keyboard@1.7.0` (`EmojiType`,
 * `Theme`, `Styles`, `CategoryTypes`, `CategoryPosition`, `EmojisByCategory`,
 * `JsonEmoji`) so the library is a structural drop-in for consumers that
 * `import type { EmojiType } from 'rn-emoji-keyboard'`, plus a few first-party
 * additions (`StorageAdapter`, extra props) marked below.
 */
import type * as React from 'react';
import type { TextStyle, ViewStyle } from 'react-native';
import type { CompactEmoji } from './data';
import type { EmojiSource } from './core/useAsyncEmojiData';

// --- categories ----------------------------------------------------------

/** All picker categories, including the virtual `recently_used` and `search`. */
export type CategoryTypes =
  | 'smileys_emotion'
  | 'people_body'
  | 'animals_nature'
  | 'food_drink'
  | 'travel_places'
  | 'activities'
  | 'objects'
  | 'symbols'
  | 'flags'
  | 'favorites'
  | 'recently_used'
  | 'search';

/** Where the category tab bar renders relative to the grid. */
export type CategoryPosition = 'floating' | 'top' | 'bottom';

/** Per-category localized labels. */
export type CategoryTranslation = {
  [key in CategoryTypes]: string;
};

// --- emoji payloads ------------------------------------------------------

/**
 * Internal per-emoji shape used for lists (incumbent-compatible `JsonEmoji`).
 * `v` is the emoji spec version as a string; `toneEnabled` marks tone support.
 */
export type JsonEmoji = {
  emoji: string;
  name: string;
  v: string;
  toneEnabled: boolean;
  keywords?: string[];
};

/**
 * Payload delivered to `onEmojiSelected`. Byte-for-byte compatible with
 * `rn-emoji-keyboard`'s `EmojiType` so existing consumer code keeps working.
 */
export type EmojiType = {
  emoji: string;
  name: string;
  slug: string;
  unicode_version: string;
  toneEnabled: boolean;
  alreadySelected?: boolean;
};

/** A category and its emoji, as consumed by the grid. */
export type EmojisByCategory = {
  title: CategoryTypes;
  data: JsonEmoji[];
};

/** The five canonical Fitzpatrick tones plus the base (`'none'`). */
export type SkinTone = 'none' | 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark';

// --- theming (incumbent-compatible) --------------------------------------

/** Recursively make every property optional (for partial `theme` / `styles`). */
export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object
      ? RecursivePartial<T[P]>
      : T[P];
};

/**
 * Color-token theme. Matches `rn-emoji-keyboard`'s `Theme` exactly, which is
 * also what TES-Chat's `buildEmojiKeyboardTheme` (restyle) produces.
 */
export type Theme = {
  backdrop: string;
  knob: string;
  container: string;
  header: string;
  skinTonesContainer: string;
  category: {
    icon: string;
    iconActive: string;
    container: string;
    containerActive: string;
  };
  search: {
    background: string;
    text: string;
    placeholder: string;
    icon: string;
  };
  customButton: {
    icon: string;
    iconPressed: string;
    background: string;
    backgroundPressed: string;
  };
  emoji: {
    selected: string;
  };
};

/** Style overrides (incumbent-compatible `Styles`). */
export type Styles = {
  container: ViewStyle;
  header: TextStyle;
  knob: ViewStyle;
  category: {
    container: ViewStyle;
    icon: TextStyle;
  };
  searchBar: {
    container: ViewStyle;
    text: TextStyle;
  };
  emoji: {
    selected: ViewStyle;
  };
};

// --- storage (first-party addition) --------------------------------------

/**
 * Swappable async storage adapter. The library owns **no** storage; consumers
 * pass an adapter (expo-sqlite, AsyncStorage, MMKV, localStorage, ...). All
 * methods may be sync or async.
 */
export interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem?(key: string): void | Promise<void>;
}

// --- component props -----------------------------------------------------

export type OnEmojiSelected = (emoji: EmojiType) => void;

/**
 * Props for the inline `<EmojiKeyboard>` component. Every prop is optional
 * except `onEmojiSelected` — matching the incumbent's public surface
 * (`Omit<Partial<KeyboardProps>, 'open' | 'onClose'> & Pick<KeyboardProps, 'onEmojiSelected'>`).
 */
export interface EmojiKeyboardProps {
  /** Fired when the user taps an emoji. */
  onEmojiSelected: OnEmojiSelected;

  // ---- incumbent-compatible props (§3 of handover) ----
  emojiSize?: number;
  hideHeader?: boolean;
  /**
   * Panel height: a number (px), a percent string (`"40%"`), or the special
   * value `"keyboard"` to match the device's software-keyboard height (like a
   * chat app swapping the OS keyboard for the emoji panel). `"keyboard"` is a
   * concrete pixel height, so the grid always gets real space on Android even
   * inside a `flex:1` parent. Defaults to `"40%"`.
   */
  defaultHeight?: number | string;
  expandable?: boolean;
  expandedHeight?: number | string;
  translation?: CategoryTranslation;
  /**
   * BCP-47-ish locale code (e.g. `'es'`, `'pt-BR'`, `'zh-Hant'`) selecting a
   * bundled category-label pack. `translation` merges on top per key; unmatched
   * locales and the virtual `recently_used` / `favorites` / `search` labels fall
   * back to English. See `AVAILABLE_LOCALES`.
   */
  locale?: string;
  disabledCategories?: CategoryTypes[];
  enableRecentlyUsed?: boolean;
  categoryPosition?: CategoryPosition;
  enableSearchBar?: boolean;
  hideSearchBarClearIcon?: boolean;
  categoryOrder?: CategoryTypes[];
  disableSafeArea?: boolean;
  allowMultipleSelections?: boolean;
  selectedEmojis?: string[] | false;
  theme?: RecursivePartial<Theme>;
  styles?: RecursivePartial<Styles>;
  customButtons?: React.ReactNode;
  emojisByCategory?: EmojisByCategory[];
  onCategoryChangeFailed?: (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => void;

  // ---- @softwhere-uz additions ----
  /** Async storage adapter for recents + skin-tone memory. Omit to disable persistence. */
  storage?: StorageAdapter;
  /** Force a fixed column count; otherwise computed from width / `emojiSize`. */
  numberOfColumns?: number;
  /** Fired when the active (visible) category changes via scroll or tab press. */
  onActiveCategoryChange?: (category: CategoryTypes) => void;
  /** Default skin tone applied to tone-enabled emoji. Defaults to `'none'`. */
  defaultSkinTone?: SkinTone;
  /**
   * Base color scheme. `'auto'` follows the OS (`prefers-color-scheme` on web).
   * `'light'` (default) / `'dark'` force one. The `theme` prop merges on top of
   * whichever base is chosen, so partial overrides still win.
   */
  colorScheme?: 'light' | 'dark' | 'auto';
  /**
   * Hide emoji introduced after this Emoji spec version (e.g. `15`) so devices
   * with an older system font never render the □ "tofu" box. Omit to show the
   * full bundled set (Emoji 17.0). Analogous to emoji-mart's `emojiVersion`.
   */
  maxEmojiVersion?: number;
  /**
   * Predicate to include/exclude individual emoji — return `false` to hide.
   * Applies to every category and to search results. Wrap in `useCallback` so
   * the grid isn't rebuilt on every render. E.g. hide flags: `(e) => e.g !== 9`.
   */
  shouldInclude?: (emoji: CompactEmoji) => boolean;
  /**
   * Override the tab-strip icon for one or more categories with a custom node
   * (any element). Categories left out keep their default emoji glyph icon.
   */
  categoryIcons?: Partial<Record<CategoryTypes, React.ReactNode>>;
  /**
   * Show a preview bar (glyph + name + shortcode) for the emoji under the
   * finger/pointer, below the grid. Defaults to `false`.
   */
  enablePreview?: boolean;
  /**
   * Enable user-curated favorites: a leading "Favorites" section plus a
   * ⭐ Favorite/Unfavorite action in the long-press popover. Persisted via
   * `storage` (in-session only without it). Defaults to `false`.
   */
  enableFavorites?: boolean;
  /**
   * Pluggable emoji data source (§8 · data delivery). Omit to use the bundled
   * Emoji 17.0 set. Provide a `CompactEmoji[]` (e.g. a smaller initial slice) or
   * a function returning a list or a `Promise` of one to lazy-load/fetch it —
   * while a Promise is in flight the grid stays empty. Memoize a function source.
   */
  emojiSource?: EmojiSource;
}
