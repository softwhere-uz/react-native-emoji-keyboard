/**
 * `useSkinTone` — global default tone plus per-emoji tone memory, both persisted
 * through a swappable async `StorageAdapter`. Verifies: remembering a tone
 * updates the map and persists it; a persisted map is loaded on mount; and a
 * late-arriving async load never clobbers a fresher local `rememberTone`
 * (the load/persist race, same guard as `useRecents`).
 */
import * as React from 'react';
import { act, render } from '@testing-library/react';
import { STORAGE_KEYS } from '../../constants';
import type { SkinTone, StorageAdapter } from '../../types';
import { useSkinTone } from '../useSkinTone';

/** A synchronous in-memory adapter whose backing store the test can inspect. */
function makeAdapter(seed: Record<string, string> = {}): StorageAdapter & {
  store: Record<string, string>;
} {
  const store: Record<string, string> = { ...seed };
  return {
    store,
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
  };
}

/** An adapter whose reads resolve only when the test calls `releaseAll()`. */
function makeDeferredAdapter(seed: Record<string, string> = {}) {
  const store: Record<string, string> = { ...seed };
  const releases: Array<() => void> = [];
  return {
    store,
    adapter: {
      // Reads reflect the store at the moment they RESOLVE (like a real queue).
      getItem: (k: string) =>
        new Promise<string | null>((resolve) => {
          releases.push(() => resolve(store[k] ?? null));
        }),
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
    } as StorageAdapter,
    releaseAll: () => releases.splice(0).forEach((r) => r()),
  };
}

// Capture the hook's latest return value across renders.
let api: ReturnType<typeof useSkinTone>;
function Probe(props: { storage?: StorageAdapter; defaultTone?: SkinTone }): React.ReactElement {
  api = useSkinTone({ storage: props.storage, defaultTone: props.defaultTone });
  return <div data-testid="tone">{api.skinTone}</div>;
}

/** Flush pending microtasks + timers so mount-time async loads settle. */
async function flush(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
  });
}

describe('useSkinTone — per-emoji tone memory', () => {
  it('remembers a tone for a base glyph and persists the map', async () => {
    const adapter = makeAdapter();
    await act(async () => {
      render(<Probe storage={adapter} />);
    });
    await flush();

    await act(async () => {
      api.rememberTone('👋', 'dark');
    });

    expect(api.toneMemory).toEqual({ '👋': 'dark' });
    expect(JSON.parse(adapter.store[STORAGE_KEYS.skinToneMemory]!)).toEqual({ '👋': 'dark' });
  });

  it('merges multiple remembered tones without dropping earlier ones', async () => {
    const adapter = makeAdapter();
    await act(async () => {
      render(<Probe storage={adapter} />);
    });
    await flush();

    await act(async () => {
      api.rememberTone('👋', 'dark');
    });
    await act(async () => {
      api.rememberTone('🎅', 'light');
    });

    expect(api.toneMemory).toEqual({ '👋': 'dark', '🎅': 'light' });
  });

  it('composes two rememberTone calls in the SAME tick (no stale-closure loss)', async () => {
    const adapter = makeAdapter();
    await act(async () => {
      render(<Probe storage={adapter} />);
    });
    await flush();

    // Both calls before any re-render — the exact stale-closure case.
    await act(async () => {
      api.rememberTone('👋', 'dark');
      api.rememberTone('🎅', 'light');
    });

    expect(api.toneMemory).toEqual({ '👋': 'dark', '🎅': 'light' });
    expect(JSON.parse(adapter.store[STORAGE_KEYS.skinToneMemory]!)).toEqual({
      '👋': 'dark',
      '🎅': 'light',
    });
  });

  it('loads a persisted per-emoji map on mount', async () => {
    const adapter = makeAdapter({
      [STORAGE_KEYS.skinToneMemory]: JSON.stringify({ '👋': 'medium-dark' }),
    });
    await act(async () => {
      render(<Probe storage={adapter} />);
    });
    await flush();

    expect(api.toneMemory).toEqual({ '👋': 'medium-dark' });
  });

  it('drops entries with invalid tone values but keeps the valid ones', async () => {
    const adapter = makeAdapter({
      [STORAGE_KEYS.skinToneMemory]: JSON.stringify({ '👋': 'chartreuse', '🎅': 'dark' }),
    });
    await act(async () => {
      render(<Probe storage={adapter} />);
    });
    await flush();

    expect(api.toneMemory).toEqual({ '🎅': 'dark' });
  });

  it('ignores a persisted value that is not a JSON object (array / string / garbage)', async () => {
    for (const bad of [JSON.stringify(['👋', 'dark']), JSON.stringify('dark'), 'not json']) {
      const adapter = makeAdapter({ [STORAGE_KEYS.skinToneMemory]: bad });
      await act(async () => {
        render(<Probe storage={adapter} />);
      });
      await flush();
      expect(api.toneMemory).toEqual({});
    }
  });

  it('does not lose DISJOINT persisted tones when a fast tap beats the read', async () => {
    // The durable-preference data-loss case: two tones persisted, user picks a
    // tone for ONE of them before the mount read resolves.
    const { adapter, store, releaseAll } = makeDeferredAdapter({
      [STORAGE_KEYS.skinToneMemory]: JSON.stringify({ '👋': 'light', '🎅': 'medium' }),
    });
    await act(async () => {
      render(<Probe storage={adapter} />);
    });

    // Fast tap: re-tone 👋 before the persisted read comes back.
    await act(async () => {
      api.rememberTone('👋', 'dark');
    });
    // The read resolves and merges — 🎅 must survive, 👋 keeps the local edit.
    await act(async () => {
      releaseAll();
      await Promise.resolve();
    });

    expect(api.toneMemory).toEqual({ '👋': 'dark', '🎅': 'medium' });
    // ...and the merged map is re-persisted, so 🎅 survives the NEXT launch too.
    expect(JSON.parse(store[STORAGE_KEYS.skinToneMemory]!)).toEqual({ '👋': 'dark', '🎅': 'medium' });
  });
});

describe('useSkinTone — global default tone', () => {
  it('starts at defaultTone, then setSkinTone updates and persists it', async () => {
    const adapter = makeAdapter();
    await act(async () => {
      render(<Probe storage={adapter} defaultTone="none" />);
    });
    await flush();
    expect(api.skinTone).toBe('none');

    await act(async () => {
      api.setSkinTone('medium');
    });
    expect(api.skinTone).toBe('medium');
    expect(adapter.store[STORAGE_KEYS.skinTone]).toBe('medium');
  });

  it('loads a persisted global tone on mount', async () => {
    const adapter = makeAdapter({ [STORAGE_KEYS.skinTone]: 'dark' });
    await act(async () => {
      render(<Probe storage={adapter} defaultTone="none" />);
    });
    await flush();
    expect(api.skinTone).toBe('dark');
  });

  it('setting the global tone does not disturb per-emoji memory (independent keys)', async () => {
    const adapter = makeAdapter();
    await act(async () => {
      render(<Probe storage={adapter} />);
    });
    await flush();

    await act(async () => {
      api.rememberTone('👋', 'dark');
    });
    await act(async () => {
      api.setSkinTone('light');
    });

    expect(api.skinTone).toBe('light');
    expect(api.toneMemory).toEqual({ '👋': 'dark' });
  });
});
