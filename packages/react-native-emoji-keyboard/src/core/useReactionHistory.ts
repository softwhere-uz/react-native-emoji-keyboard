/**
 * `useReactionHistory` — recent/frequent quick-reaction tracking for a smart
 * `ReactionStrip` (issue #3). Chat apps lead the reaction menu with the emoji
 * you actually use (Slack), and expose a default reaction for a double-tap
 * shortcut (Telegram). This glyph-keyed, persisted, race-safe hook ranks used
 * reactions and pads the row with a customizable `base` set so it's always full.
 * Pure React (`react` only).
 */
import * as React from 'react';
import { STORAGE_KEYS } from '../constants';
import type { StorageAdapter } from '../types';
import { readAdapter, writeAdapter } from './adapters';
import { DEFAULT_QUICK_REACTIONS } from './reactions';

/** Ranking for used reactions. */
export type ReactionHistoryMode = 'recent' | 'frequent';

type Entry = { count: number; seq: number };
type HistoryMap = Record<string, Entry>;

function parseMap(raw: string | null): HistoryMap {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const out: HistoryMap = {};
    for (const [glyph, v] of Object.entries(parsed as Record<string, unknown>)) {
      const e = v as { count?: unknown; seq?: unknown };
      if (typeof e?.count === 'number' && typeof e?.seq === 'number') {
        out[glyph] = { count: e.count, seq: e.seq };
      }
    }
    return out;
  } catch {
    return {};
  }
}

/** Used glyphs ranked by mode (recent = seq desc; frequent = count desc, seq desc). */
function rankUsed(map: HistoryMap, mode: ReactionHistoryMode): string[] {
  return Object.entries(map)
    .sort(([, a], [, b]) =>
      mode === 'frequent' ? b.count - a.count || b.seq - a.seq : b.seq - a.seq
    )
    .map(([glyph]) => glyph);
}

export function useReactionHistory(opts: {
  storage?: StorageAdapter;
  enabled?: boolean;
  base?: readonly string[];
  limit?: number;
  mode?: ReactionHistoryMode;
}): {
  /** Ordered glyphs to render: used-first, padded with `base`, deduped, capped. */
  reactions: string[];
  /** The top reaction (for a double-tap shortcut), or `base[0]`. */
  defaultReaction: string;
  /** Record a reaction use. */
  recordReaction: (glyph: string) => void;
  /** Clear the tracked history. */
  clear: () => void;
} {
  const { storage, enabled = true, base = DEFAULT_QUICK_REACTIONS, mode = 'recent' } = opts;
  const limit = opts.limit && opts.limit > 0 ? opts.limit : base.length || 6;

  const [map, setMap] = React.useState<HistoryMap>({});
  const mapRef = React.useRef<HistoryMap>(map);
  mapRef.current = map;
  const touchedRef = React.useRef(false);
  const seqRef = React.useRef(0);

  React.useEffect(() => {
    if (!enabled) return;
    let active = true;
    void readAdapter(storage, STORAGE_KEYS.reactions).then((raw) => {
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
    (next: HistoryMap) => {
      if (!enabled) return;
      void writeAdapter(storage, STORAGE_KEYS.reactions, JSON.stringify(next));
    },
    [enabled, storage]
  );

  const recordReaction = React.useCallback(
    (glyph: string) => {
      touchedRef.current = true;
      const prev = mapRef.current;
      seqRef.current += 1;
      const next: HistoryMap = {
        ...prev,
        [glyph]: { count: (prev[glyph]?.count ?? 0) + 1, seq: seqRef.current },
      };
      mapRef.current = next;
      setMap(next);
      persist(next);
    },
    [persist]
  );

  const clear = React.useCallback(() => {
    touchedRef.current = true;
    seqRef.current = 0;
    mapRef.current = {};
    setMap({});
    persist({});
  }, [persist]);

  // used-first, padded with base, deduped, capped to `limit`.
  const reactions = React.useMemo(() => {
    const used = rankUsed(map, mode);
    const seen = new Set<string>();
    const out: string[] = [];
    for (const glyph of [...used, ...base]) {
      if (seen.has(glyph)) continue;
      seen.add(glyph);
      out.push(glyph);
      if (out.length >= limit) break;
    }
    return out;
  }, [map, mode, base, limit]);

  const defaultReaction = reactions[0] ?? base[0] ?? '';

  return { reactions, defaultReaction, recordReaction, clear };
}
