/**
 * `useFrequentlyUsed` — usage-count ("frecency") tracking for a leading
 * "Frequently used" section (issue #2). Unlike {@link useRecents} (pure
 * recency), this keeps a persisted per-emoji count and ranks by it, so the emoji
 * you reach for most stay at the top. A curated cold-start set fills the row
 * before any usage. Pure React (`react` only); race-safe like the other
 * persistence hooks.
 */
import * as React from 'react';
import { DEFAULT_FREQUENT, DEFAULT_RECENTS_LIMIT, STORAGE_KEYS } from '../constants';
import type { EmojiType, StorageAdapter } from '../types';
import { readAdapter, writeAdapter } from './adapters';
import { resolveReaction } from './reactions';

/** Ranking strategy for the frequently-used section. */
export type FrequentMode = 'frequency' | 'frecency';

/** One tracked emoji: its payload, use `count`, and monotonic `seq` (recency). */
type FrequentEntry = { e: EmojiType; count: number; seq: number };
type FrequentMap = Record<string, FrequentEntry>;

/** Cold-start list resolved to full `EmojiType` once. */
const COLD_START: EmojiType[] = DEFAULT_FREQUENT.map((glyph) => resolveReaction(glyph));

function parseMap(raw: string | null): FrequentMap {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const out: FrequentMap = {};
    for (const [glyph, value] of Object.entries(parsed as Record<string, unknown>)) {
      const v = value as { e?: unknown; count?: unknown; seq?: unknown };
      if (
        typeof v === 'object' &&
        v !== null &&
        typeof v.count === 'number' &&
        typeof v.seq === 'number' &&
        typeof v.e === 'object' &&
        v.e !== null &&
        typeof (v.e as { emoji?: unknown }).emoji === 'string'
      ) {
        out[glyph] = { e: v.e as EmojiType, count: v.count, seq: v.seq };
      }
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Rank a map into a capped `EmojiType[]`.
 * - `frequency`: count desc, then recency (`seq`) desc.
 * - `frecency`: a blended score `count + seq/(maxSeq+1)` so a high count wins,
 *   but recent use breaks ties and can nudge a fresh pick above an old rare one.
 */
function rank(map: FrequentMap, mode: FrequentMode, limit: number): EmojiType[] {
  const entries = Object.values(map);
  if (entries.length === 0) return COLD_START.slice(0, limit);
  const maxSeq = entries.reduce((m, e) => Math.max(m, e.seq), 0);
  const score = (e: FrequentEntry) =>
    mode === 'frecency' ? e.count + e.seq / (maxSeq + 1) : e.count;
  const sorted = [...entries].sort((a, b) => {
    const d = score(b) - score(a);
    return d !== 0 ? d : b.seq - a.seq;
  });
  return sorted.slice(0, limit).map((entry) => entry.e);
}

export function useFrequentlyUsed(opts: {
  storage?: StorageAdapter;
  enabled?: boolean;
  mode?: FrequentMode;
  limit?: number;
}): {
  frequent: EmojiType[];
  bump: (e: EmojiType) => void;
  clearFrequent: () => void;
} {
  const { storage, enabled = true, mode = 'frecency', limit = DEFAULT_RECENTS_LIMIT } = opts;
  const [map, setMap] = React.useState<FrequentMap>({});

  // Synchronous source of truth so same-tick bumps compose (no stale closure).
  const mapRef = React.useRef<FrequentMap>(map);
  mapRef.current = map;
  const touchedRef = React.useRef(false);
  const seqRef = React.useRef(0);

  React.useEffect(() => {
    if (!enabled) return;
    let active = true;
    void readAdapter(storage, STORAGE_KEYS.frequentlyUsed).then((raw) => {
      if (!active || touchedRef.current) return;
      const loaded = parseMap(raw);
      seqRef.current = Object.values(loaded).reduce((m, e) => Math.max(m, e.seq), 0);
      setMap(loaded);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = React.useCallback(
    (next: FrequentMap) => {
      if (!enabled) return;
      void writeAdapter(storage, STORAGE_KEYS.frequentlyUsed, JSON.stringify(next));
    },
    [enabled, storage]
  );

  const bump = React.useCallback(
    (e: EmojiType) => {
      touchedRef.current = true;
      const glyph = e.emoji;
      const prev = mapRef.current;
      const existing = prev[glyph];
      seqRef.current += 1;
      const next: FrequentMap = {
        ...prev,
        [glyph]: { e, count: (existing?.count ?? 0) + 1, seq: seqRef.current },
      };
      mapRef.current = next;
      setMap(next);
      persist(next);
    },
    [persist]
  );

  const clearFrequent = React.useCallback(() => {
    touchedRef.current = true;
    seqRef.current = 0;
    mapRef.current = {};
    setMap({});
    persist({});
  }, [persist]);

  const frequent = React.useMemo(() => rank(map, mode, limit), [map, mode, limit]);

  return { frequent, bump, clearFrequent };
}
