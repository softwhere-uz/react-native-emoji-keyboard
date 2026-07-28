/**
 * `useFavorites` — user-curated favorite emoji, persisted through a swappable
 * async `StorageAdapter`. Mirrors `useRecents`' race-safety (a late async load
 * must not clobber a local toggle) but the operation is a membership TOGGLE
 * (add if absent, remove if present) that preserves insertion order — not a
 * prepend-and-cap. Verifies: toggle add/remove, `isFavorite`, the boolean
 * return (new membership), persistence, load-on-mount, the load/persist race,
 * and same-tick compose (two toggles in one tick both survive).
 */
import * as React from 'react';
import { act, render } from '@testing-library/react';
import { STORAGE_KEYS } from '../../constants';
import type { EmojiType, StorageAdapter } from '../../types';
import { useFavorites } from '../useFavorites';

/** A synchronous in-memory adapter whose backing store the test can inspect. */
function makeAdapter(seed: Record<string, string> = {}): StorageAdapter & {
  store: Record<string, string>;
} {
  const store: Record<string, string> = { ...seed };
  return {
    store,
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
  };
}

/** An adapter whose reads resolve only when the test calls `release()`. */
function makeDeferredAdapter(seed: Record<string, string> = {}) {
  const store: Record<string, string> = { ...seed };
  const releases: Array<() => void> = [];
  return {
    store,
    release: () => releases.splice(0).forEach((r) => r()),
    adapter: {
      getItem: (k: string) =>
        new Promise<string | null>((resolve) => {
          releases.push(() => resolve(k in store ? store[k] : null));
        }),
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    } satisfies StorageAdapter,
  };
}

function emoji(glyph: string, name: string): EmojiType {
  return { emoji: glyph, name, slug: name.replace(/\s+/g, '_'), unicode_version: '1.0', toneEnabled: false };
}

const GRIN = emoji('😀', 'grinning face');
const HEART = emoji('❤️', 'red heart');

type Api = ReturnType<typeof useFavorites>;
let api: Api;
function Probe(opts: Parameters<typeof useFavorites>[0]): React.ReactElement {
  api = useFavorites(opts);
  return <div />;
}

test('toggles membership: add then remove, reflected by isFavorite and the return value', async () => {
  const { adapter } = makeAdapter();
  await act(async () => {
    render(<Probe storage={adapter} />);
  });
  expect(api.favorites).toEqual([]);
  expect(api.isFavorite('😀')).toBe(false);

  let nowFav: boolean | undefined;
  await act(async () => {
    nowFav = api.toggleFavorite(GRIN);
  });
  expect(nowFav).toBe(true);
  expect(api.isFavorite('😀')).toBe(true);
  expect(api.favorites.map((f) => f.emoji)).toEqual(['😀']);

  await act(async () => {
    nowFav = api.toggleFavorite(GRIN);
  });
  expect(nowFav).toBe(false);
  expect(api.isFavorite('😀')).toBe(false);
  expect(api.favorites).toEqual([]);
});

test('preserves insertion order and persists the list', async () => {
  const withStore = makeAdapter();
  await act(async () => {
    render(<Probe storage={withStore} />);
  });
  await act(async () => {
    api.toggleFavorite(GRIN);
    api.toggleFavorite(HEART); // same tick — both must survive (sync-ref compose)
  });
  expect(api.favorites.map((f) => f.emoji)).toEqual(['😀', '❤️']);

  const persisted = JSON.parse(withStore.store[STORAGE_KEYS.favorites]);
  expect(persisted.map((f: EmojiType) => f.emoji)).toEqual(['😀', '❤️']);
});

test('loads persisted favorites on mount', async () => {
  const seeded = makeAdapter({
    [STORAGE_KEYS.favorites]: JSON.stringify([HEART]),
  });
  await act(async () => {
    render(<Probe storage={seeded} />);
  });
  expect(api.isFavorite('❤️')).toBe(true);
  expect(api.favorites.map((f) => f.emoji)).toEqual(['❤️']);
});

test('a late-arriving load does NOT clobber a fresher local toggle (race guard)', async () => {
  const deferred = makeDeferredAdapter({
    [STORAGE_KEYS.favorites]: JSON.stringify([HEART]), // persisted, still loading
  });
  await act(async () => {
    render(<Probe storage={deferred.adapter} />);
  });
  // User favorites GRIN before the slow read resolves.
  await act(async () => {
    api.toggleFavorite(GRIN);
  });
  // Now the stale persisted read (only HEART) resolves — must not wipe GRIN.
  await act(async () => {
    deferred.release();
  });
  expect(api.isFavorite('😀')).toBe(true);
  expect(api.favorites.map((f) => f.emoji)).toContain('😀');
});

test('clearFavorites empties and persists', async () => {
  const withStore = makeAdapter();
  await act(async () => {
    render(<Probe storage={withStore} />);
  });
  await act(async () => {
    api.toggleFavorite(GRIN);
  });
  await act(async () => {
    api.clearFavorites();
  });
  expect(api.favorites).toEqual([]);
  expect(JSON.parse(withStore.store[STORAGE_KEYS.favorites])).toEqual([]);
});
