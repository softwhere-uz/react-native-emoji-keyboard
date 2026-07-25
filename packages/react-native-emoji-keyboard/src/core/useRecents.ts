/**
 * `useRecents` — recently-used emoji, persisted through a swappable async
 * `StorageAdapter`. Pure React (`react` only); persistence is delegated to the
 * platform-agnostic {@link readAdapter}/{@link writeAdapter} helpers, so this
 * runs unchanged in jsdom, on web, and on native.
 */
import * as React from 'react';
import { DEFAULT_RECENTS_LIMIT, STORAGE_KEYS } from '../constants';
import type { EmojiType, StorageAdapter } from '../types';
import { readAdapter, writeAdapter } from './adapters';

/** Parse persisted JSON into a defensive `EmojiType[]` (never throws). */
function parseRecents(raw: string | null): EmojiType[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is EmojiType =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as { emoji?: unknown }).emoji === 'string'
    );
  } catch {
    return [];
  }
}

/** Cap a list to `limit`, keeping only positive limits meaningful. */
function capList(list: EmojiType[], limit: number): EmojiType[] {
  const max = limit > 0 ? limit : DEFAULT_RECENTS_LIMIT;
  return list.length > max ? list.slice(0, max) : list;
}

export function useRecents(opts: {
  storage?: StorageAdapter;
  enabled?: boolean;
  limit?: number;
}): {
  recents: EmojiType[];
  addRecent: (e: EmojiType) => void;
  clearRecents: () => void;
} {
  const { storage, enabled = true, limit = DEFAULT_RECENTS_LIMIT } = opts;
  const [recents, setRecents] = React.useState<EmojiType[]>([]);

  // Keep the latest recents in a ref so persistence closures never go stale.
  const recentsRef = React.useRef<EmojiType[]>(recents);
  recentsRef.current = recents;

  // Once the user has picked/cleared locally, a late-arriving async load must
  // NOT clobber that fresh state (load/persist race).
  const touchedRef = React.useRef(false);

  // Load once on mount (async-safe; guarded against unmount and local edits).
  React.useEffect(() => {
    if (!enabled) return;
    let active = true;
    void readAdapter(storage, STORAGE_KEYS.recents).then((raw) => {
      if (!active || touchedRef.current) return;
      setRecents(capList(parseRecents(raw), limit));
    });
    return () => {
      active = false;
    };
    // Load is a mount-time concern; limit/enabled/storage changes don't reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = React.useCallback(
    (next: EmojiType[]) => {
      if (!enabled) return;
      void writeAdapter(storage, STORAGE_KEYS.recents, JSON.stringify(next));
    },
    [enabled, storage]
  );

  const addRecent = React.useCallback(
    (e: EmojiType) => {
      touchedRef.current = true;
      setRecents((prev) => {
        const deduped = prev.filter((r) => r.emoji !== e.emoji);
        const next = capList([e, ...deduped], limit);
        persist(next);
        return next;
      });
    },
    [limit, persist]
  );

  const clearRecents = React.useCallback(() => {
    touchedRef.current = true;
    setRecents([]);
    persist([]);
  }, [persist]);

  return { recents, addRecent, clearRecents };
}
