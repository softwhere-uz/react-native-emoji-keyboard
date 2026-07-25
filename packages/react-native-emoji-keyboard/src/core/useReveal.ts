/**
 * `useReveal` — the §4 guard that makes the "empty grid" web bug impossible by
 * construction.
 *
 * The incumbent gated first paint on a deferred post-interaction callback
 * (`runAfterInteractions`), which does NOT reliably fire on react-native-web,
 * leaving the grid visibly empty. We instead reveal via `requestAnimationFrame`
 * as soon as there is data to show, and then STAY revealed — so neither a
 * scroll-driven category change nor a search keystroke can ever blank the grid.
 * Imports ONLY from `react` (no `react-native`), so it runs unchanged in jsdom,
 * on web, and on native.
 */
import * as React from 'react';

/**
 * Returns `false` until there is data to show, then flips to `true` on the next
 * animation frame and stays `true`. Consumers gate their first grid paint on the
 * returned flag; subsequent scroll/category/search changes never re-hide it
 * (that feedback loop is exactly what reintroduces the §4 empty-grid bug).
 */
export function useReveal(input: { dataLength: number }): boolean {
  const { dataLength } = input;
  const [revealed, setRevealed] = React.useState(false);

  React.useEffect(() => {
    if (revealed || dataLength <= 0) return;
    const handle = requestAnimationFrame(() => {
      setRevealed(true);
    });
    return () => cancelAnimationFrame(handle);
  }, [dataLength, revealed]);

  return revealed;
}
