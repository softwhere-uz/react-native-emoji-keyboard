/**
 * `useFavorites` — user-curated favorite emoji, persisted through a swappable
 * async `StorageAdapter`. Pure React (`react` only); persistence is delegated to
 * the platform-agnostic {@link readAdapter}/{@link writeAdapter} helpers, so this
 * runs unchanged in jsdom, on web, and on native.
 *
 * Unlike {@link useRecents} (auto-populated, prepend-and-cap), favorites are
 * user-curated: `toggleFavorite` flips membership (add if absent, remove if
 * present) and preserves insertion order. Same load/persist race-safety as
 * recents — a late async load must never clobber a fresh local toggle.
 */
import * as React from 'react';
import { STORAGE_KEYS } from '../constants';
import type { EmojiType, StorageAdapter } from '../types';
import { readAdapter, writeAdapter } from './adapters';

/** Parse persisted JSON into a defensive `EmojiType[]` (never throws). */
function parseFavorites(raw: string | null): EmojiType[] {
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

export function useFavorites(opts: {
  storage?: StorageAdapter;
  enabled?: boolean;
}): {
  favorites: EmojiType[];
  /** Add if absent, remove if present. Returns the NEW membership (true = now favorited). */
  toggleFavorite: (e: EmojiType) => boolean;
  /** Whether the given glyph is currently a favorite. */
  isFavorite: (glyph: string) => boolean;
  clearFavorites: () => void;
} {
  const { storage, enabled = true } = opts;
  const [favorites, setFavorites] = React.useState<EmojiType[]>([]);

  // Keep the latest list in a ref so persistence closures and the synchronous
  // `isFavorite`/`toggleFavorite` reads never go stale.
  const favoritesRef = React.useRef<EmojiType[]>(favorites);
  favoritesRef.current = favorites;

  // Once the user has toggled/cleared locally, a late-arriving async load must
  // NOT clobber that fresh state (load/persist race).
  const touchedRef = React.useRef(false);

  // Load once on mount (async-safe; guarded against unmount and local edits).
  React.useEffect(() => {
    if (!enabled) return;
    let active = true;
    void readAdapter(storage, STORAGE_KEYS.favorites).then((raw) => {
      if (!active || touchedRef.current) return;
      setFavorites(parseFavorites(raw));
    });
    return () => {
      active = false;
    };
    // Load is a mount-time concern; enabled/storage changes don't reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = React.useCallback(
    (next: EmojiType[]) => {
      if (!enabled) return;
      void writeAdapter(storage, STORAGE_KEYS.favorites, JSON.stringify(next));
    },
    [enabled, storage]
  );

  const isFavorite = React.useCallback(
    (glyph: string) => favoritesRef.current.some((f) => f.emoji === glyph),
    []
  );

  const toggleFavorite = React.useCallback(
    (e: EmojiType): boolean => {
      touchedRef.current = true;
      const wasFavorite = favoritesRef.current.some((f) => f.emoji === e.emoji);
      // Compute the next list synchronously so callers get the new membership
      // and same-tick toggles compose (the ref is updated inside the updater).
      setFavorites((prev) => {
        const next = wasFavorite
          ? prev.filter((f) => f.emoji !== e.emoji)
          : [...prev, e];
        favoritesRef.current = next;
        persist(next);
        return next;
      });
      return !wasFavorite;
    },
    [persist]
  );

  const clearFavorites = React.useCallback(() => {
    touchedRef.current = true;
    favoritesRef.current = [];
    setFavorites([]);
    persist([]);
  }, [persist]);

  return { favorites, toggleFavorite, isFavorite, clearFavorites };
}
