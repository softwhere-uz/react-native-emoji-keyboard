/**
 * `useAsyncEmojiData` — resolve the emoji bundle from a pluggable source
 * (§8 · data delivery). The library still ships the full Emoji 17.0 set, but a
 * consumer can hand in a smaller initial slice and lazy-load the rest (a tiny
 * first paint, then swap in the full set), or fetch from Emojibase/a CDN.
 *
 * Sources:
 *  - `undefined` → the bundled set, synchronously (no loading state).
 *  - a `CompactEmoji[]` → used as-is, synchronously.
 *  - a function returning a list → called once; if it returns a Promise the hook
 *    reports `loading` until it settles, then swaps in the result (or surfaces
 *    the rejection as `error`).
 *
 * Race-safe: a resolution is ignored if the source changed or the component
 * unmounted first. Memoize a function source (module scope or `useCallback`),
 * otherwise a new identity each render re-triggers the load.
 *
 * Pure React (`react` only) — unit-testable in jsdom.
 */
import * as React from 'react';
import { emojis as BUNDLED, type CompactEmoji } from '../data';

/** A pluggable emoji data source. See {@link useAsyncEmojiData}. */
export type EmojiSource =
  | readonly CompactEmoji[]
  | (() => readonly CompactEmoji[] | Promise<readonly CompactEmoji[]>);

/** The resolved data plus its loading/error status. */
export type AsyncEmojiData = {
  emojis: readonly CompactEmoji[];
  loading: boolean;
  error: unknown;
};

function isThenable(value: unknown): value is Promise<readonly CompactEmoji[]> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

/** The immediately-known state for a source (before any async work). */
function initialState(source: EmojiSource | undefined): AsyncEmojiData {
  if (source === undefined) return { emojis: BUNDLED, loading: false, error: null };
  if (Array.isArray(source)) {
    return { emojis: source as readonly CompactEmoji[], loading: false, error: null };
  }
  // A function source: assume async until proven sync in the effect.
  return { emojis: [], loading: true, error: null };
}

export function useAsyncEmojiData(source?: EmojiSource): AsyncEmojiData {
  const [state, setState] = React.useState<AsyncEmojiData>(() => initialState(source));

  React.useEffect(() => {
    if (source === undefined) {
      setState({ emojis: BUNDLED, loading: false, error: null });
      return;
    }
    if (Array.isArray(source)) {
      setState({ emojis: source as readonly CompactEmoji[], loading: false, error: null });
      return;
    }

    let cancelled = false;
    let result: readonly CompactEmoji[] | Promise<readonly CompactEmoji[]>;
    try {
      result = (source as () => readonly CompactEmoji[] | Promise<readonly CompactEmoji[]>)();
    } catch (error) {
      setState({ emojis: [], loading: false, error });
      return;
    }

    if (isThenable(result)) {
      // Keep the last-known list on screen while the next one loads.
      setState((prev) => ({ emojis: prev.emojis, loading: true, error: null }));
      result.then(
        (list) => {
          if (!cancelled) setState({ emojis: list, loading: false, error: null });
        },
        (error) => {
          if (!cancelled) setState({ emojis: [], loading: false, error });
        }
      );
      return () => {
        cancelled = true;
      };
    }

    setState({ emojis: result, loading: false, error: null });
    return;
  }, [source]);

  return state;
}
