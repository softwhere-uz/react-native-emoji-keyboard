/**
 * `useSkinTone` — skin-tone state, persisted through a swappable async
 * `StorageAdapter`. Pure React (`react` only). Owns two things:
 *
 *  - the **global default** tone applied to every tone-enabled emoji, and
 *  - **per-emoji memory**: a map of base-glyph → tone, so an individual emoji
 *    (e.g. 🎅 vs 👋) can remember its own tone independent of the default.
 *
 * The effective tone for an emoji is `toneMemory[baseGlyph] ?? skinTone`;
 * {@link buildGrid} applies exactly that.
 *
 * Persistence correctness (the memory map is a durable preference, so it must
 * never silently lose entries):
 *  - `memoryRef` is the synchronous source of truth, so several `rememberTone`
 *    calls in one tick compose instead of clobbering each other.
 *  - Writes are gated until the initial async read resolves; that read then
 *    MERGES persisted-but-unread entries under any pre-load local edits (local
 *    wins per key) and re-persists — so a fast tap during a slow read can never
 *    wipe tones the read hadn't returned yet.
 */
import * as React from 'react';
import { SKIN_TONES, STORAGE_KEYS } from '../constants';
import type { SkinTone, StorageAdapter } from '../types';
import { readAdapter, writeAdapter } from './adapters';

const VALID_TONES = new Set<string>(SKIN_TONES);

/** Narrow an arbitrary persisted string to a valid `SkinTone`, else `null`. */
function parseTone(raw: string | null): SkinTone | null {
  if (!raw) return null;
  return VALID_TONES.has(raw) ? (raw as SkinTone) : null;
}

/**
 * Parse persisted JSON into a defensive `{ [baseGlyph]: SkinTone }` map, keeping
 * only string→valid-tone entries. Rejects non-objects/arrays. Never throws.
 */
function parseMemory(raw: string | null): Record<string, SkinTone> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const out: Record<string, SkinTone> = {};
    for (const [glyph, tone] of Object.entries(parsed as Record<string, unknown>)) {
      if (glyph && typeof tone === 'string' && VALID_TONES.has(tone)) {
        out[glyph] = tone as SkinTone;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function useSkinTone(opts: {
  storage?: StorageAdapter;
  defaultTone?: SkinTone;
}): {
  /** The global default tone. */
  skinTone: SkinTone;
  /** Set the global default tone (persisted). */
  setSkinTone: (t: SkinTone) => void;
  /** Per-emoji tone overrides, keyed by base glyph (`CompactEmoji.e`). */
  toneMemory: Readonly<Record<string, SkinTone>>;
  /** Remember `tone` for a specific base glyph (persisted). */
  rememberTone: (baseGlyph: string, tone: SkinTone) => void;
} {
  const { storage, defaultTone = 'none' } = opts;
  const [skinTone, setSkinToneState] = React.useState<SkinTone>(defaultTone);
  const [toneMemory, setToneMemory] = React.useState<Record<string, SkinTone>>({});

  // Synchronous source of truth for the memory map — kept in lockstep with the
  // rendered state so same-tick `rememberTone` calls compose (no stale closure).
  const memoryRef = React.useRef<Record<string, SkinTone>>(toneMemory);
  memoryRef.current = toneMemory;

  // Once the user has chosen the GLOBAL tone locally, a late async load must not
  // revert it. (The map uses a merge-on-load strategy instead — see below.)
  const touchedToneRef = React.useRef(false);
  // Whether a local `rememberTone` happened before the initial read resolved.
  const touchedMemoryRef = React.useRef(false);
  // Gate map writes until the initial read has been merged, so a pre-load edit
  // can't persist an incomplete map over not-yet-read entries.
  const memoryLoadedRef = React.useRef(false);

  // Load both persisted values once on mount (async-safe; guarded against
  // unmount and — for the map — merged rather than overwritten).
  React.useEffect(() => {
    let active = true;

    void readAdapter(storage, STORAGE_KEYS.skinTone).then((raw) => {
      if (!active || touchedToneRef.current) return;
      const persisted = parseTone(raw);
      if (persisted) setSkinToneState(persisted);
    });

    void readAdapter(storage, STORAGE_KEYS.skinToneMemory).then((raw) => {
      if (!active) return;
      memoryLoadedRef.current = true;
      // Local edits made before this read resolved win per key; untouched
      // persisted entries are preserved (never wiped by a pre-load edit).
      const merged = { ...parseMemory(raw), ...memoryRef.current };
      if (Object.keys(merged).length === 0) return;
      memoryRef.current = merged;
      setToneMemory(merged);
      // A pre-load edit's write was suppressed (gated) — persist the merge now
      // so storage regains any entries that edit would otherwise have dropped.
      if (touchedMemoryRef.current) {
        void writeAdapter(storage, STORAGE_KEYS.skinToneMemory, JSON.stringify(merged));
      }
    });

    return () => {
      active = false;
    };
    // Mount-time load only; storage identity changes don't re-read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSkinTone = React.useCallback(
    (t: SkinTone) => {
      touchedToneRef.current = true;
      setSkinToneState(t);
      void writeAdapter(storage, STORAGE_KEYS.skinTone, t);
    },
    [storage]
  );

  const rememberTone = React.useCallback(
    (baseGlyph: string, tone: SkinTone) => {
      if (!baseGlyph) return;
      // No-op when unchanged: skip the state churn (and grid rebuild).
      if (memoryRef.current[baseGlyph] === tone) return;
      touchedMemoryRef.current = true;
      const next = { ...memoryRef.current, [baseGlyph]: tone };
      memoryRef.current = next;
      setToneMemory(next);
      // Suppress the write until the initial read is merged; the load effect
      // persists the merged map instead. After that, write through normally.
      if (memoryLoadedRef.current) {
        void writeAdapter(storage, STORAGE_KEYS.skinToneMemory, JSON.stringify(next));
      }
    },
    [storage]
  );

  return { skinTone, setSkinTone, toneMemory, rememberTone };
}
