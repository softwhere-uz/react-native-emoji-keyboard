/**
 * `useSearch` — controlled search query + memoized ranked results over a
 * `CompactEmoji[]`. Pure React (`react` only); ranking is delegated to the
 * platform-agnostic {@link searchEmojis}.
 */
import * as React from 'react';
import type { CompactEmoji } from '../data';
import { searchEmojis } from './search';

export function useSearch(list: CompactEmoji[]): {
  query: string;
  setQuery: (q: string) => void;
  results: CompactEmoji[];
} {
  const [query, setQuery] = React.useState('');

  const results = React.useMemo(() => searchEmojis(query, list), [query, list]);

  return { query, setQuery, results };
}
