/**
 * §4 · `useGridNavigation` — focus state, composing moves, and grid-change
 * reset. Exercised through the public hook API with `renderHook`.
 */
import { act, renderHook } from '@testing-library/react';
import { buildGrid } from '../buildGrid';
import type { CompactEmoji } from '../../data';
import type { Section } from '../internal-types';
import { useGridNavigation } from '../useGridNavigation';

function emojis(prefix: string, n: number): CompactEmoji[] {
  return Array.from({ length: n }, (_, i) => ({ e: `${prefix}${i}`, n: `${prefix} ${i}`, g: 0, o: i }));
}
const SECTIONS: Section[] = [{ category: 'smileys_emotion', label: 'A', emojis: emojis('a', 5) }];
const GRID = buildGrid(SECTIONS, 3, 'none'); // header(0), rowA0(1: a0..a2), rowA1(2: a3,a4)

test('starts with no focus and no active emoji', () => {
  const { result } = renderHook(() => useGridNavigation(GRID));
  expect(result.current.focus).toBeNull();
  expect(result.current.activeEmoji).toBeNull();
});

test('focusFirst lands on the top-left cell and exposes its emoji', () => {
  const { result } = renderHook(() => useGridNavigation(GRID));
  act(() => {
    result.current.focusFirst();
  });
  expect(result.current.focus).toEqual({ item: 1, col: 0 });
  expect(result.current.activeEmoji?.glyph).toBe('a0');
  expect(result.current.isFocused(1, 0)).toBe(true);
  expect(result.current.isFocused(1, 1)).toBe(false);
});

test('successive moves in one tick compose via the synchronous ref', () => {
  const { result } = renderHook(() => useGridNavigation(GRID));
  act(() => {
    result.current.focusFirst(); // (1,0)
    result.current.move('ArrowRight'); // (1,1)
    result.current.move('ArrowRight'); // (1,2)
    result.current.move('ArrowDown'); // (2,1) — clamped to short row
  });
  expect(result.current.focus).toEqual({ item: 2, col: 1 });
  expect(result.current.activeEmoji?.glyph).toBe('a4');
});

test('move returns the resolved focus for imperative focus/scroll', () => {
  const { result } = renderHook(() => useGridNavigation(GRID));
  let returned: unknown;
  act(() => {
    returned = result.current.move('ArrowRight'); // from null → (1,0) → (1,1)
  });
  expect(returned).toEqual({ item: 1, col: 1 });
});

test('changing the grid clears focus (stale indices are invalid)', () => {
  const { result, rerender } = renderHook(({ grid }) => useGridNavigation(grid), {
    initialProps: { grid: GRID },
  });
  act(() => {
    result.current.focusFirst();
  });
  expect(result.current.focus).not.toBeNull();

  const NEXT = buildGrid(
    [{ category: 'search', label: 'Search', emojis: emojis('s', 2) }],
    3,
    'none'
  );
  rerender({ grid: NEXT });
  expect(result.current.focus).toBeNull();
});
