/**
 * Flattens logical `Section[]` into the `GridModel` the FlashList renders.
 *
 * Layout: for each section, one `header` item followed by the section's emoji
 * chunked into rows of `numColumns`. Header positions are recorded for sticky
 * headers and for jump-to-category. Pure — no React, no `react-native`.
 */
import type { SkinTone } from '../types';
import { applyTone } from './skinTone';
import type { GridItem, GridModel, RenderEmoji, Section } from './internal-types';

/**
 * Build the flattened grid model.
 *
 * @param sections     Ordered logical sections (header + emoji).
 * @param numColumns   Emoji per row; clamped to `>= 1`.
 * @param tone         Active skin tone applied per-emoji via {@link applyTone}.
 */
export function buildGrid(sections: Section[], numColumns: number, tone: SkinTone): GridModel {
  const columns = Math.max(1, Math.floor(numColumns) || 1);

  const items: GridItem[] = [];
  const stickyHeaderIndices: number[] = [];
  const categoryToIndex: GridModel['categoryToIndex'] = {};

  for (const section of sections) {
    const { category, label, emojis } = section;

    const headerIndex = items.length;
    stickyHeaderIndices.push(headerIndex);
    categoryToIndex[category] = headerIndex;
    items.push({
      type: 'header',
      category,
      label,
      key: `h:${category}`,
    });

    let rowNum = 0;
    for (let i = 0; i < emojis.length; i += columns) {
      const rowEmojis: RenderEmoji[] = [];
      for (let c = 0; c < columns; c += 1) {
        const emoji = emojis[i + c];
        if (!emoji) break;
        rowEmojis.push({ glyph: applyTone(emoji, tone), source: emoji });
      }
      items.push({
        type: 'row',
        category,
        emojis: rowEmojis,
        key: `r:${category}:${rowNum}`,
      });
      rowNum += 1;
    }
  }

  return { items, stickyHeaderIndices, categoryToIndex };
}
