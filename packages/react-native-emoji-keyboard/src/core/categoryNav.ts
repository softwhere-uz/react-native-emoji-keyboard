/**
 * Pure category-stepping helper for the swipe-to-change-category gesture
 * (§6 · category-change gesture). Given the ordered categories currently in the
 * grid and the active one, return the previous/next category — clamped at the
 * ends (no wrap), so a swipe past the first/last category is a no-op. No React,
 * no `react-native`.
 */

/**
 * @param ordered  Categories in scroll order (as shown in the tab strip).
 * @param current  The active category, or `undefined` if none yet.
 * @param dir      `1` for the next category, `-1` for the previous.
 * @returns The adjacent category, or `undefined` at a boundary / empty list.
 */
export function adjacentCategory<T>(
  ordered: readonly T[],
  current: T | undefined,
  dir: 1 | -1
): T | undefined {
  if (ordered.length === 0) return undefined;
  const idx = current === undefined ? -1 : ordered.indexOf(current);
  if (idx === -1) return dir === 1 ? ordered[0] : ordered[ordered.length - 1];
  const next = idx + dir;
  if (next < 0 || next >= ordered.length) return undefined; // clamp — no wrap
  return ordered[next];
}
