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
import type { GridModel, Section } from './internal-types';

/**
 * Module-level: group the bundle by picker category once. `emojis` is already
 * sorted by (group, order), so per-category arrays inherit canonical order.
 */
const EMOJIS_BY_CATEGORY: Partial<Record<CategoryTypes, CompactEmoji[]>> = (() => {
  const map: Partial<Record<CategoryTypes, CompactEmoji[]>> = {};
  for (const e of ALL_EMOJIS) {
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
})();

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
  enableRecentlyUsed: boolean;
  recents: EmojiType[];
  translation: Partial<Record<CategoryTypes, string>> | undefined;
  override: EmojisByCategory[] | undefined;
}): Section[] {
  const { categoryOrder, disabled, enableRecentlyUsed, recents, translation, override } = opts;

  // A consumer-provided override fully replaces the bundle-derived categories.
  const overrideMap = override
    ? new Map(override.map((c) => [c.title, c.data]))
    : undefined;

  const sections: Section[] = [];

  const showRecents = enableRecentlyUsed && recents.length > 0 && !disabled.has('recently_used');
  if (showRecents) {
    sections.push({
      category: 'recently_used',
      label: labelFor('recently_used', translation),
      emojis: recents.map(emojiTypeToCompact),
    });
  }

  for (const category of categoryOrder) {
    if (category === 'recently_used' || category === 'search') continue;
    if (disabled.has(category)) continue;

    let emojis: CompactEmoji[] | undefined;
    if (overrideMap) {
      const overridden = overrideMap.get(category);
      emojis = overridden ? overridden.map(jsonEmojiToCompact) : undefined;
    } else {
      emojis = EMOJIS_BY_CATEGORY[category];
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
  enableRecentlyUsed?: boolean;
  recents?: EmojiType[];
  skinTone: SkinTone;
  numColumns: number;
  searchResults?: CompactEmoji[] | null;
  translation?: Partial<Record<CategoryTypes, string>>;
  emojisByCategoryOverride?: EmojisByCategory[];
}): { grid: GridModel; sections: Section[] } {
  const {
    categoryOrder,
    disabledCategories,
    enableRecentlyUsed = false,
    recents,
    skinTone,
    numColumns,
    searchResults,
    translation,
    emojisByCategoryOverride,
  } = opts;

  const sections = React.useMemo<Section[]>(() => {
    // Search mode: a single virtual "search" section of the results. A non-null
    // array means "searching" — even when EMPTY, so a query that matches nothing
    // shows an empty result rather than falling back to the whole emoji grid.
    if (Array.isArray(searchResults)) {
      return [
        {
          category: 'search',
          label: labelFor('search', translation),
          emojis: searchResults,
        },
      ];
    }

    const order = categoryOrder ?? [...DEFAULT_CATEGORY_ORDER];
    const disabled = new Set<CategoryTypes>(disabledCategories ?? []);

    return buildDefaultSections({
      categoryOrder: order,
      disabled,
      enableRecentlyUsed,
      recents: recents ?? [],
      translation,
      override: emojisByCategoryOverride,
    });
  }, [
    categoryOrder,
    disabledCategories,
    enableRecentlyUsed,
    recents,
    searchResults,
    translation,
    emojisByCategoryOverride,
  ]);

  const grid = React.useMemo<GridModel>(
    () => buildGrid(sections, numColumns, skinTone),
    [sections, numColumns, skinTone]
  );

  return { grid, sections };
}
