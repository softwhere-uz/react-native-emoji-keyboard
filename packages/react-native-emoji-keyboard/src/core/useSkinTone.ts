/**
 * `useSkinTone` — the global default skin tone, persisted through a swappable
 * async `StorageAdapter`. Pure React (`react` only). Per-emoji tone memory is a
 * v0.2 concern; this owns just the single global tone.
 */
import * as React from 'react';
import { SKIN_TONES, STORAGE_KEYS } from '../constants';
import type { SkinTone, StorageAdapter } from '../types';
import { readAdapter, writeAdapter } from './adapters';

/** Narrow an arbitrary persisted string to a valid `SkinTone`, else `null`. */
function parseTone(raw: string | null): SkinTone | null {
  if (!raw) return null;
  return (SKIN_TONES as readonly string[]).includes(raw) ? (raw as SkinTone) : null;
}

export function useSkinTone(opts: {
  storage?: StorageAdapter;
  defaultTone?: SkinTone;
}): {
  skinTone: SkinTone;
  setSkinTone: (t: SkinTone) => void;
} {
  const { storage, defaultTone = 'none' } = opts;
  const [skinTone, setSkinToneState] = React.useState<SkinTone>(defaultTone);

  // Once the user has chosen a tone locally, a late async load must not revert it.
  const touchedRef = React.useRef(false);

  // Load persisted tone once on mount (async-safe; guarded against unmount + edits).
  React.useEffect(() => {
    let active = true;
    void readAdapter(storage, STORAGE_KEYS.skinTone).then((raw) => {
      if (!active || touchedRef.current) return;
      const persisted = parseTone(raw);
      if (persisted) setSkinToneState(persisted);
    });
    return () => {
      active = false;
    };
    // Mount-time load only; storage identity changes don't re-read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSkinTone = React.useCallback(
    (t: SkinTone) => {
      touchedRef.current = true;
      setSkinToneState(t);
      void writeAdapter(storage, STORAGE_KEYS.skinTone, t);
    },
    [storage]
  );

  return { skinTone, setSkinTone };
}
