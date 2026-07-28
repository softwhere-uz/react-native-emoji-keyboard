/**
 * §4 · keyboard grid navigation — pure movement rules over a `GridModel`.
 * Built from real `buildGrid` output so the header-skipping and column-clamping
 * exercise the exact structure the FlashList renders.
 */
import { buildGrid } from '../buildGrid';
import type { CompactEmoji } from '../../data';
import type { Section } from '../internal-types';
import {
  emojiAtFocus,
  firstGridFocus,
  isGridNavKey,
  lastGridFocus,
  nextGridFocus,
  normalizeFocus,
} from '../gridNavigation';

/** Make `n` throwaway emoji whose glyph encodes the label + index (base tone). */
function emojis(prefix: string, n: number): CompactEmoji[] {
  return Array.from({ length: n }, (_, i) => ({ e: `${prefix}${i}`, n: `${prefix} ${i}`, g: 0, o: i }));
}

/**
 * Two categories, 3 columns:
 *   header A         (item 0)
 *   row A0: a0 a1 a2 (item 1)
 *   row A1: a3 a4    (item 2, short)
 *   header B         (item 3)
 *   row B0: b0 b1 b2 (item 4)
 */
const SECTIONS: Section[] = [
  { category: 'smileys_emotion', label: 'A', emojis: emojis('a', 5) },
  { category: 'people_body', label: 'B', emojis: emojis('b', 3) },
];
const GRID = buildGrid(SECTIONS, 3, 'none');

test('firstGridFocus is the first row item, column 0; last is the final cell', () => {
  expect(firstGridFocus(GRID)).toEqual({ item: 1, col: 0 });
  expect(lastGridFocus(GRID)).toEqual({ item: 4, col: 2 });
  expect(emojiAtFocus(GRID, firstGridFocus(GRID))?.glyph).toBe('a0');
  expect(emojiAtFocus(GRID, lastGridFocus(GRID))?.glyph).toBe('b2');
});

test('ArrowRight advances within a row', () => {
  expect(nextGridFocus(GRID, { item: 1, col: 0 }, 'ArrowRight')).toEqual({ item: 1, col: 1 });
});

test('ArrowRight at row end jumps to the first cell of the next row (skipping headers)', () => {
  // End of A0 (a2) → first cell of A1 (a3).
  expect(nextGridFocus(GRID, { item: 1, col: 2 }, 'ArrowRight')).toEqual({ item: 2, col: 0 });
  // End of A1 (a4) → across the B header → first cell of B0 (b0).
  expect(nextGridFocus(GRID, { item: 2, col: 1 }, 'ArrowRight')).toEqual({ item: 4, col: 0 });
});

test('ArrowRight at the very last cell clamps (no-op)', () => {
  expect(nextGridFocus(GRID, { item: 4, col: 2 }, 'ArrowRight')).toEqual({ item: 4, col: 2 });
});

test('ArrowLeft at row start jumps to the last cell of the previous row', () => {
  // Start of B0 (b0) → last cell of A1 (a4).
  expect(nextGridFocus(GRID, { item: 4, col: 0 }, 'ArrowLeft')).toEqual({ item: 2, col: 1 });
});

test('ArrowLeft at the very first cell clamps (no-op)', () => {
  expect(nextGridFocus(GRID, { item: 1, col: 0 }, 'ArrowLeft')).toEqual({ item: 1, col: 0 });
});

test('ArrowDown keeps the column and clamps to a shorter target row', () => {
  // a2 (col 2) down → A1 has only 2 cells → clamp to col 1 (a4).
  expect(nextGridFocus(GRID, { item: 1, col: 2 }, 'ArrowDown')).toEqual({ item: 2, col: 1 });
});

test('ArrowDown across a category boundary keeps the column', () => {
  // a3 (item 2, col 0) down → B0 first row, col 0 (b0).
  expect(nextGridFocus(GRID, { item: 2, col: 0 }, 'ArrowDown')).toEqual({ item: 4, col: 0 });
});

test('ArrowDown on the last row clamps (no-op)', () => {
  expect(nextGridFocus(GRID, { item: 4, col: 1 }, 'ArrowDown')).toEqual({ item: 4, col: 1 });
});

test('ArrowUp keeps the column and clamps at the top', () => {
  expect(nextGridFocus(GRID, { item: 4, col: 2 }, 'ArrowUp')).toEqual({ item: 2, col: 1 });
  expect(nextGridFocus(GRID, { item: 1, col: 1 }, 'ArrowUp')).toEqual({ item: 1, col: 1 });
});

test('Home/End move within the row; ctrl widens to the whole grid', () => {
  expect(nextGridFocus(GRID, { item: 1, col: 2 }, 'Home')).toEqual({ item: 1, col: 0 });
  expect(nextGridFocus(GRID, { item: 2, col: 0 }, 'End')).toEqual({ item: 2, col: 1 });
  expect(nextGridFocus(GRID, { item: 2, col: 1 }, 'Home', { ctrl: true })).toEqual({ item: 1, col: 0 });
  expect(nextGridFocus(GRID, { item: 1, col: 0 }, 'End', { meta: true })).toEqual({ item: 4, col: 2 });
});

test('normalizeFocus snaps a header-pointing or out-of-range focus onto a cell', () => {
  // item 0 is the A header → snap to the next row (item 1).
  expect(normalizeFocus(GRID, { item: 0, col: 0 })).toEqual({ item: 1, col: 0 });
  // Over-long column clamps to the row length.
  expect(normalizeFocus(GRID, { item: 2, col: 9 })).toEqual({ item: 2, col: 1 });
  // A null focus normalizes to the first cell.
  expect(normalizeFocus(GRID, null)).toEqual({ item: 1, col: 0 });
});

test('a null starting focus with a real key still resolves from the top-left', () => {
  // From nothing, ArrowRight normalizes to (1,0) then advances to (1,1).
  expect(nextGridFocus(GRID, null, 'ArrowRight')).toEqual({ item: 1, col: 1 });
});

test('an empty grid yields null focus for every query', () => {
  const empty = buildGrid([], 3, 'none');
  expect(firstGridFocus(empty)).toBeNull();
  expect(lastGridFocus(empty)).toBeNull();
  expect(nextGridFocus(empty, { item: 0, col: 0 }, 'ArrowRight')).toBeNull();
  expect(emojiAtFocus(empty, { item: 0, col: 0 })).toBeNull();
});

test('isGridNavKey recognizes only the handled keys', () => {
  expect(isGridNavKey('ArrowUp')).toBe(true);
  expect(isGridNavKey('End')).toBe(true);
  expect(isGridNavKey('Enter')).toBe(false);
  expect(isGridNavKey('a')).toBe(false);
});
