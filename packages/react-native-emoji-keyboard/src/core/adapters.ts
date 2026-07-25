/**
 * Storage-adapter helpers. The library owns NO storage; consumers pass a
 * `StorageAdapter` whose methods may be sync or async. These helpers normalize
 * that (always awaitable) and tolerate a missing adapter (no-op). Pure — no
 * React, no `react-native`, no `window`/`localStorage`.
 */
import type { StorageAdapter } from '../types';

/**
 * An in-memory `StorageAdapter` backed by a `Map`. Methods are synchronous.
 * Useful as a default/test adapter when the consumer supplies none.
 */
export function createMemoryAdapter(): StorageAdapter {
  const store = new Map<string, string>();
  return {
    getItem(key: string): string | null {
      return store.has(key) ? (store.get(key) as string) : null;
    },
    setItem(key: string, value: string): void {
      store.set(key, value);
    },
    removeItem(key: string): void {
      store.delete(key);
    },
  };
}

/**
 * Read a key from a (possibly sync/async/absent) adapter. Returns `null` when
 * the adapter is missing, the key is absent, or the read throws.
 */
export async function readAdapter(
  a: StorageAdapter | undefined,
  key: string
): Promise<string | null> {
  if (!a) return null;
  try {
    const result = await a.getItem(key);
    return result ?? null;
  } catch {
    return null;
  }
}

/**
 * Write a key to a (possibly sync/async/absent) adapter. No-op when the adapter
 * is missing; swallows write errors so persistence failures never crash the UI.
 */
export async function writeAdapter(
  a: StorageAdapter | undefined,
  key: string,
  value: string
): Promise<void> {
  if (!a) return;
  try {
    await a.setItem(key, value);
  } catch {
    // Best-effort persistence: ignore failures.
  }
}
