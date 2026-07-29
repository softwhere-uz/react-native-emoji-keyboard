/**
 * `useEmojiData` — the central headless data hook. Turns the flat emoji bundle
 * (or a search result set, or an override) into ordered `Section[]` and a
 * flattened `GridModel`, honoring category order, disabled categories,
 * recently-used, skin tone, and localized labels. Pure React (`react` only).
 *
 * The emoji bundle is grouped by category ONCE at module load (below) so this
 * hook only slices precomputed arrays.
 */
import * as React from 'react';
import { emojis as ALL_EMOJIS, type CompactEmoji } from '../data';
import {
  DEFAULT_CATEGORY_LABELS,
  DEFAULT_CATEGORY_ORDER,
  GROUP_ID_TO_CATEGORY,
} from '../constants';
import type { CategoryTypes, EmojiType, EmojisByCategory, JsonEmoji, SkinTone } from '../types';
import { buildGrid } from './buildGrid';
import { filterByEmojiVersion } from './version';
import type { GridModel, Section } from './internal-types';

/**
 * Group a flat emoji list by picker category, preserving each list's order.
 * Assumes the input is already sorted by (group, order) — as both the bundle
 * and Emojibase output are — so per-category arrays inherit canonical order.
 */
function groupByCategory(
  list: readonly CompactEmoji[]
): Partial<Record<CategoryTypes, CompactEmoji[]>> {
  const map: Partial<Record<CategoryTypes, CompactEmoji[]>> = {};
  for (const e of list) {
    const category = GROUP_ID_TO_CATEGORY[e.g];
    if (!category) continue;
    let bucket = map[category];
    if (!bucket) {
      bucket = [];
      map[category] = bucket;
    }
    bucket.push(e);
  }
  return map;
}

/** The bundled set grouped once at module load — the default (no `emojiSource`). */
const EMOJIS_BY_CATEGORY: Partial<Record<CategoryTypes, CompactEmoji[]>> =
  groupByCategory(ALL_EMOJIS);

/** Adapt a persisted/consumer `EmojiType` into a `CompactEmoji` for the grid. */
function emojiTypeToCompact(e: EmojiType): CompactEmoji {
  const version = Number.parseFloat(e.unicode_version);
  const compact: CompactEmoji = {
    e: e.emoji,
    n: e.name,
    g: -1,
    o: 0,
  };
  if (Number.isFinite(version)) compact.v = version;
  return compact;
}

/** Adapt an override `JsonEmoji` into a `CompactEmoji` for the grid. */
function jsonEmojiToCompact(e: JsonEmoji): CompactEmoji {
  const version = Number.parseFloat(e.v);
  const compact: CompactEmoji = {
    e: e.emoji,
    n: e.name,
    g: -1,
    o: 0,
  };
  if (Array.isArray(e.keywords) && e.keywords.length > 0) compact.k = e.keywords;
  if (Number.isFinite(version)) compact.v = version;
  if (e.img) compact.img = e.img;
  return compact;
}

function labelFor(
  category: CategoryTypes,
  translation: Partial<Record<CategoryTypes, string>> | undefined
): string {
  return translation?.[category] ?? DEFAULT_CATEGORY_LABELS[category];
}

/**
 * Build the effective (non-search) sections from the bundle, honoring order,
 * disabled categories, and recently-used.
 */
function buildDefaultSections(opts: {
  categoryOrder: CategoryTypes[];
  disabled: Set<CategoryTypes>;
  byCategory: Partial<Record<CategoryTypes, CompactEmoji[]>>;
  enableFavorites: boolean;
  favorites: EmojiType[];
  enableRecentlyUsed: boolean;
  recents: EmojiType[];
  translation: Partial<Record<CategoryTypes, string>> | undefined;
  override: EmojisByCategory[] | undefined;
}): Section[] {
  const { categoryOrder, disabled, byCategory, enableFavorites, favorites, enableRecentlyUsed, recents, translation, override } = opts;

  // A consumer-provided override fully replaces the bundle-derived categories.
  const overrideMap = override
    ? new Map(override.map((c) => [c.title, c.data]))
    : undefined;

  const sections: Section[] = [];

  // Favorites lead the grid (user-curated), then recently-used.
  const showFavorites = enableFavorites && favorites.length > 0 && !disabled.has('favorites');
  if (showFavorites) {
    sections.push({
      category: 'favorites',
      label: labelFor('favorites', translation),
      emojis: favorites.map(emojiTypeToCompact),
    });
  }

  const showRecents = enableRecentlyUsed && recents.length > 0 && !disabled.has('recently_used');
  if (showRecents) {
    sections.push({
      category: 'recently_used',
      label: labelFor('recently_used', translation),
      emojis: recents.map(emojiTypeToCompact),
    });
  }

  for (const category of categoryOrder) {
    if (category === 'favorites' || category === 'recently_used' || category === 'search') continue;
    if (disabled.has(category)) continue;

    let emojis: CompactEmoji[] | undefined;
    if (overrideMap) {
      const overridden = overrideMap.get(category);
      emojis = overridden ? overridden.map(jsonEmojiToCompact) : undefined;
    } else {
      emojis = byCategory[category];
    }

    if (!emojis || emojis.length === 0) continue;
    sections.push({
      category,
      label: labelFor(category, translation),
      emojis,
    });
  }

  return sections;
}

export function useEmojiData(opts: {
  categoryOrder?: CategoryTypes[];
  disabledCategories?: CategoryTypes[];
  enableFavorites?: boolean;
  favorites?: EmojiType[];
  enableRecentlyUsed?: boolean;
  recents?: EmojiType[];
  skinTone: SkinTone;
  toneMemory?: Readonly<Record<string, SkinTone>>;
  numColumns: number;
  searchResults?: CompactEmoji[] | null;
  translation?: Partial<Record<CategoryTypes, string>>;
  emojisByCategoryOverride?: EmojisByCategory[];
  /** Hide emoji newer than this Emoji spec version (tofu-gating). */
  maxEmojiVersion?: number;
  /** Keep only emoji for which this returns true (e.g. hide flags). Memoize it. */
  shouldInclude?: (emoji: CompactEmoji) => boolean;
  /**
   * Alternate emoji bundle to categorize (§8 · async/lazy data). Omit to use the
   * built-in Emoji 17.0 set (grouped once at module load). Memoize it — a new
   * array identity each render re-groups the whole bundle.
   */
  emojiSource?: readonly CompactEmoji[];
}): { grid: GridModel; sections: Section[] } {
  const {
    categoryOrder,
    disabledCategories,
    enableFavorites = false,
    favorites,
    enableRecentlyUsed = false,
    recents,
    skinTone,
    toneMemory,
    numColumns,
    searchResults,
    translation,
    emojisByCategoryOverride,
    maxEmojiVersion,
    shouldInclude,
    emojiSource,
  } = opts;

  // Group the active bundle by category. The default set is pre-grouped at
  // module load; a custom source is grouped here (memoized on its identity).
  const byCategory = React.useMemo(
    () => (emojiSource ? groupByCategory(emojiSource) : EMOJIS_BY_CATEGORY),
    [emojiSource]
  );

  const sections = React.useMemo<Section[]>(() => {
    // Search mode: a single virtual "search" section of the results. A non-null
    // array means "searching" — even when EMPTY, so a query that matches nothing
    // shows an empty result rather than falling back to the whole emoji grid.
    // Combined per-list filter: tofu-gating then the consumer predicate.
    const applyFilters = (list: CompactEmoji[]): CompactEmoji[] => {
      const versioned = filterByEmojiVersion(list, maxEmojiVersion);
      return shouldInclude ? versioned.filter(shouldInclude) : versioned;
    };

    if (Array.isArray(searchResults)) {
      // Keep the (possibly empty) search section so a filtered-away or no-match
      // query still shows an empty result rather than the full grid.
      return [
        {
          category: 'search',
          label: labelFor('search', translation),
          emojis: applyFilters(searchResults),
        },
      ];
    }

    const order = categoryOrder ?? [...DEFAULT_CATEGORY_ORDER];
    const disabled = new Set<CategoryTypes>(disabledCategories ?? []);

    const base = buildDefaultSections({
      categoryOrder: order,
      disabled,
      byCategory,
      enableFavorites,
      favorites: favorites ?? [],
      enableRecentlyUsed,
      recents: recents ?? [],
      translation,
      override: emojisByCategoryOverride,
    });

    // No filter active → return as-is. Otherwise filter, dropping any category
    // the filter emptied so no blank header shows.
    if (maxEmojiVersion == null && !shouldInclude) return base;
    const filtered: Section[] = [];
    for (const section of base) {
      const emojis = applyFilters(section.emojis);
      if (emojis.length > 0) filtered.push({ ...section, emojis });
    }
    return filtered;
  }, [
    categoryOrder,
    disabledCategories,
    byCategory,
    enableFavorites,
    favorites,
    enableRecentlyUsed,
    recents,
    searchResults,
    translation,
    emojisByCategoryOverride,
    maxEmojiVersion,
    shouldInclude,
  ]);

  const grid = React.useMemo<GridModel>(
    () => buildGrid(sections, numColumns, skinTone, toneMemory),
    [sections, numColumns, skinTone, toneMemory]
  );

  return { grid, sections };
}
