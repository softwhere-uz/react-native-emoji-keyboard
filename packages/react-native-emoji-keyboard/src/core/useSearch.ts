/**
 * `useSearch` — controlled search query + memoized ranked results over a
 * `CompactEmoji[]`. Optional debounce (smooth typing on large sets) and a
 * minimum query length before searching (issue #7). Pure React (`react` only);
 * ranking is delegated to the platform-agnostic {@link searchEmojis}.
 */
import * as React from 'react';
import type { CompactEmoji } from '../data';
import { searchEmojis } from './search';

export function useSearch(
  list: CompactEmoji[],
  opts: { debounceMs?: number; minChars?: number } = {}
): {
  query: string;
  setQuery: (q: string) => void;
  results: CompactEmoji[];
  /** True once the (trimmed) query meets `minChars` — drives search mode. */
  isSearching: boolean;
} {
  const { debounceMs = 0, minChars = 1 } = opts;
  const [query, setQuery] = React.useState('');
  const [debounced, setDebounced] = React.useState('');

  React.useEffect(() => {
    if (debounceMs <= 0) {
      setDebounced(query);
      return;
    }
    const timer = setTimeout(() => setDebounced(query), debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const isSearching = query.trim().length >= minChars;

  const results = React.useMemo(() => {
    const q = debounced.trim();
    if (q.length < minChars) return [];
    return searchEmojis(debounced, list);
  }, [debounced, list, minChars]);

  return { query, setQuery, results, isSearching };
}
