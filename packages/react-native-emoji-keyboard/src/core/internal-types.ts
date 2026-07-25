/**
 * Internal, platform-agnostic model types for the headless core.
 *
 * These describe the flattened grid the FlashList renders: alternating
 * category `header` rows and `row`s of pre-tone-applied emoji. Nothing here
 * imports `react-native`, so the whole core is unit-testable in jsdom.
 */
import type { CompactEmoji } from '../data';
import type { CategoryTypes } from '../types';

/** A single emoji ready to render: the resolved glyph plus its source record. */
export type RenderEmoji = {
  /** The glyph to draw — tone-applied when the emoji supports the active tone. */
  glyph: string;
  /** The underlying compact record (label, keywords, tones, ...). */
  source: CompactEmoji;
};

/**
 * One flattened list item. Either a sticky category `header` or a `row`
 * holding up to `numColumns` emoji. Keys are deterministic and stable.
 */
export type GridItem =
  | {
      type: 'header';
      category: CategoryTypes;
      label: string;
      key: string;
    }
  | {
      type: 'row';
      category: CategoryTypes;
      emojis: RenderEmoji[];
      key: string;
    };

/**
 * The full flattened grid: the list items, the indices of every header
 * (for `stickyHeaderIndices`), and a fast category → header-index lookup
 * (for `scrollToIndex` jump-to-category).
 */
export type GridModel = {
  items: GridItem[];
  stickyHeaderIndices: number[];
  categoryToIndex: Partial<Record<CategoryTypes, number>>;
};

/** A logical category section prior to flattening into grid rows. */
export type Section = {
  category: CategoryTypes;
  label: string;
  emojis: CompactEmoji[];
};
