/**
 * Headless keyboard-navigation model for the emoji grid (§4 · accessibility).
 *
 * The rendered grid is a flat `GridModel` of alternating `header` and `row`
 * items; only `row` items hold focusable emoji. A focus position is therefore
 * `{ item, col }` — the index of a row item plus the column within it. This
 * module turns an arrow/Home/End key into the next valid focus position,
 * skipping headers and clamping at the grid edges. It is pure (no React, no
 * `react-native`), so the whole navigation contract is unit-testable in jsdom
 * exactly as a browser would drive it; the component layer only has to forward
 * DOM key events and move focus/scroll to the resolved cell.
 */
import type { GridItem, GridModel, RenderEmoji } from './internal-types';

/** A focusable cell: `item` indexes `grid.items` (a `row`); `col` the emoji. */
export type GridFocus = { item: number; col: number };

/** The navigation keys this model understands (DOM `KeyboardEvent.key` values). */
export type GridNavKey =
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'Home'
  | 'End';

/** Modifiers that widen Home/End from row-scope to whole-grid-scope. */
export type GridNavModifiers = { ctrl?: boolean; meta?: boolean };

/** Item indices of every focusable (`row`) item, in visual order. */
function rowItemIndices(grid: GridModel): number[] {
  const out: number[] = [];
  for (let i = 0; i < grid.items.length; i += 1) {
    if (grid.items[i]?.type === 'row') out.push(i);
  }
  return out;
}

/** Number of emoji in the row item at `itemIndex` (0 if it is not a row). */
function rowLength(grid: GridModel, itemIndex: number): number {
  const item = grid.items[itemIndex];
  return item && item.type === 'row' ? item.emojis.length : 0;
}

/**
 * Snap an arbitrary (possibly stale or header-pointing) focus to the nearest
 * valid focusable cell. Returns `null` only when the grid has no focusable
 * cells at all (e.g. an empty search result).
 */
export function normalizeFocus(grid: GridModel, focus: GridFocus | null): GridFocus | null {
  const rows = rowItemIndices(grid);
  const firstRow = rows[0];
  const lastRow = rows[rows.length - 1];
  if (firstRow === undefined || lastRow === undefined) return null;

  if (!focus) return { item: firstRow, col: 0 };

  let item = focus.item;
  if (grid.items[item]?.type !== 'row') {
    // Prefer the next row at/after the requested index, else the last row.
    item = rows.find((r) => r >= focus.item) ?? lastRow;
  }
  const len = rowLength(grid, item);
  const col = Math.max(0, Math.min(focus.col, len - 1));
  return { item, col };
}

/** The first focusable cell (top-left of the grid), or `null` if none. */
export function firstGridFocus(grid: GridModel): GridFocus | null {
  return normalizeFocus(grid, null);
}

/** The last focusable cell (bottom-right of the grid), or `null` if none. */
export function lastGridFocus(grid: GridModel): GridFocus | null {
  const rows = rowItemIndices(grid);
  const last = rows[rows.length - 1];
  if (last === undefined) return null;
  return { item: last, col: Math.max(0, rowLength(grid, last) - 1) };
}

/** The `RenderEmoji` at a focus position, or `null` if the focus is invalid. */
export function emojiAtFocus(grid: GridModel, focus: GridFocus | null): RenderEmoji | null {
  if (!focus) return null;
  const item: GridItem | undefined = grid.items[focus.item];
  if (!item || item.type !== 'row') return null;
  return item.emojis[focus.col] ?? null;
}

/**
 * Resolve a key press into the next focus position.
 *
 * - Left/Right move by one cell and wrap across row (and category) boundaries,
 *   skipping headers; clamped at the grid's first/last cell.
 * - Up/Down move one visual row within the same column, clamping the column to
 *   the target row's length; clamped at the grid's top/bottom.
 * - Home/End move to the start/end of the current row — or, with ctrl/meta, to
 *   the first/last cell of the whole grid.
 *
 * A no-op move (already at the edge) returns the current, normalized focus, so
 * callers can always trust the result points at a real cell (or `null` when the
 * grid is empty).
 */
export function nextGridFocus(
  grid: GridModel,
  current: GridFocus | null,
  key: GridNavKey,
  modifiers: GridNavModifiers = {}
): GridFocus | null {
  const rows = rowItemIndices(grid);
  if (rows.length === 0) return null;

  const cur = normalizeFocus(grid, current);
  if (!cur) return null;
  const pos = rows.indexOf(cur.item); // index of the current row within `rows`

  const nextRow = rows[pos + 1]; // may be undefined at the last row
  const prevRow = rows[pos - 1]; // may be undefined at the first row

  switch (key) {
    case 'ArrowRight': {
      if (cur.col + 1 < rowLength(grid, cur.item)) return { item: cur.item, col: cur.col + 1 };
      if (nextRow !== undefined) return { item: nextRow, col: 0 };
      return cur;
    }
    case 'ArrowLeft': {
      if (cur.col > 0) return { item: cur.item, col: cur.col - 1 };
      if (prevRow !== undefined) {
        return { item: prevRow, col: Math.max(0, rowLength(grid, prevRow) - 1) };
      }
      return cur;
    }
    case 'ArrowDown': {
      if (nextRow !== undefined) {
        return { item: nextRow, col: Math.min(cur.col, rowLength(grid, nextRow) - 1) };
      }
      return cur;
    }
    case 'ArrowUp': {
      if (prevRow !== undefined) {
        return { item: prevRow, col: Math.min(cur.col, rowLength(grid, prevRow) - 1) };
      }
      return cur;
    }
    case 'Home': {
      const first = rows[0];
      if ((modifiers.ctrl || modifiers.meta) && first !== undefined) return { item: first, col: 0 };
      return { item: cur.item, col: 0 };
    }
    case 'End': {
      if (modifiers.ctrl || modifiers.meta) return lastGridFocus(grid) ?? cur;
      return { item: cur.item, col: Math.max(0, rowLength(grid, cur.item) - 1) };
    }
    default:
      return cur;
  }
}

/** Whether a raw string is a navigation key this model handles. */
export function isGridNavKey(key: string): key is GridNavKey {
  return (
    key === 'ArrowLeft' ||
    key === 'ArrowRight' ||
    key === 'ArrowUp' ||
    key === 'ArrowDown' ||
    key === 'Home' ||
    key === 'End'
  );
}
