/**
 * `useGridNavigation` — controlled keyboard-focus state over a `GridModel`.
 *
 * Holds the currently keyboard-focused cell and exposes imperative movers that
 * apply {@link nextGridFocus} and return the resolved position (so a component's
 * key handler can both update focus and imperatively focus/scroll the cell in
 * one call). Pure React (`react` only) — the component layer forwards DOM key
 * events and reacts to the returned focus; it never re-implements the movement
 * rules.
 *
 * Focus is cleared whenever the grid identity changes (search toggles, category
 * filters), because `{ item, col }` indices are meaningless across a different
 * data set — resuming keyboard nav then starts cleanly at the top-left.
 */
import * as React from 'react';
import type { GridModel, RenderEmoji } from './internal-types';
import {
  emojiAtFocus,
  firstGridFocus,
  nextGridFocus,
  type GridFocus,
  type GridNavKey,
  type GridNavModifiers,
} from './gridNavigation';

export type UseGridNavigation = {
  /** The currently keyboard-focused cell, or `null` when nothing is focused. */
  focus: GridFocus | null;
  /** Apply a key press; sets and returns the next focus (`null` if grid empty). */
  move: (key: GridNavKey, modifiers?: GridNavModifiers) => GridFocus | null;
  /** Focus the first cell (top-left); returns it (`null` if grid empty). */
  focusFirst: () => GridFocus | null;
  /** Directly set (or clear) the focused cell. */
  setFocus: (focus: GridFocus | null) => void;
  /** Clear keyboard focus entirely. */
  clearFocus: () => void;
  /** The `RenderEmoji` under the current focus, or `null`. */
  activeEmoji: RenderEmoji | null;
  /** Whether the cell at (`item`, `col`) is the focused one (for roving tabindex). */
  isFocused: (item: number, col: number) => boolean;
};

export function useGridNavigation(grid: GridModel): UseGridNavigation {
  const [focus, setFocusState] = React.useState<GridFocus | null>(null);
  // Synchronous mirror so successive moves in one tick compose correctly.
  const focusRef = React.useRef<GridFocus | null>(null);

  const commit = React.useCallback((next: GridFocus | null) => {
    focusRef.current = next;
    setFocusState(next);
  }, []);

  // A different grid (search on/off, filter change) invalidates stored indices.
  React.useEffect(() => {
    focusRef.current = null;
    setFocusState(null);
  }, [grid]);

  const move = React.useCallback(
    (key: GridNavKey, modifiers?: GridNavModifiers): GridFocus | null => {
      const next = nextGridFocus(grid, focusRef.current, key, modifiers);
      commit(next);
      return next;
    },
    [grid, commit]
  );

  const focusFirst = React.useCallback((): GridFocus | null => {
    const next = firstGridFocus(grid);
    commit(next);
    return next;
  }, [grid, commit]);

  const setFocus = React.useCallback((next: GridFocus | null) => commit(next), [commit]);
  const clearFocus = React.useCallback(() => commit(null), [commit]);

  const activeEmoji = React.useMemo(() => emojiAtFocus(grid, focus), [grid, focus]);

  const isFocused = React.useCallback(
    (item: number, col: number) => focus?.item === item && focus?.col === col,
    [focus]
  );

  return { focus, move, focusFirst, setFocus, clearFocus, activeEmoji, isFocused };
}
