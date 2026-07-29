/**
 * §7 · media provider — useMediaSearch: trending fallback, debounced search,
 * race-safety, and error handling, via a mock provider.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { mediaPreviewUri, useMediaSearch } from '../media';
import type { MediaItem, MediaProvider } from '../media';

const item = (id: string): MediaItem => ({ id, kind: 'gif', url: `https://cdn/${id}.gif` });

function mockProvider(overrides: Partial<MediaProvider> = {}): MediaProvider {
  return {
    id: 'mock',
    title: 'Mock',
    search: async (q) => [item(`s-${q}`)],
    trending: async () => [item('trend-1'), item('trend-2')],
    ...overrides,
  };
}

test('an empty query loads trending immediately', async () => {
  const provider = mockProvider();
  const { result } = renderHook(() => useMediaSearch(provider, '', { debounceMs: 0 }));
  await waitFor(() => expect(result.current.items).toHaveLength(2));
  expect(result.current.items.map((i) => i.id)).toEqual(['trend-1', 'trend-2']);
  expect(result.current.loading).toBe(false);
});

test('a non-empty query calls search (debounced) with the trimmed text', async () => {
  const search = jest.fn(async (q: string) => [item(`hit-${q}`)]);
  const provider = mockProvider({ search });
  const { result } = renderHook(() => useMediaSearch(provider, '  cat  ', { debounceMs: 0 }));
  await waitFor(() => expect(result.current.items).toHaveLength(1));
  expect(search).toHaveBeenCalledWith('cat', expect.anything());
  expect(result.current.items[0]?.id).toBe('hit-cat');
});

test('a provider without trending yields an empty list for an empty query', async () => {
  const provider = mockProvider({ trending: undefined });
  const { result } = renderHook(() => useMediaSearch(provider, '', { debounceMs: 0 }));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.items).toEqual([]);
});

test('a rejected search surfaces the error and clears items', async () => {
  const boom = new Error('rate limited');
  const provider = mockProvider({ search: async () => { throw boom; } });
  const { result } = renderHook(() => useMediaSearch(provider, 'x', { debounceMs: 0 }));
  await waitFor(() => expect(result.current.error).toBe(boom));
  expect(result.current.items).toEqual([]);
});

test('a superseded query never commits its stale result', async () => {
  let resolveSlow: (v: MediaItem[]) => void = () => {};
  const provider = mockProvider({
    search: (q) =>
      q === 'slow'
        ? new Promise<MediaItem[]>((r) => (resolveSlow = r))
        : Promise.resolve([item(`fast-${q}`)]),
  });
  const { result, rerender } = renderHook(({ q }) => useMediaSearch(provider, q, { debounceMs: 0 }), {
    initialProps: { q: 'slow' },
  });
  rerender({ q: 'fast' });
  await waitFor(() => expect(result.current.items.map((i) => i.id)).toEqual(['fast-fast']));
  // The slow 'slow' query resolves late — it must not overwrite the fast result.
  act(() => resolveSlow([item('slow-late')]));
  expect(result.current.items.map((i) => i.id)).toEqual(['fast-fast']);
});

test('mediaPreviewUri prefers previewUrl, else the full url', () => {
  expect(mediaPreviewUri(item('a'))).toBe('https://cdn/a.gif');
  expect(mediaPreviewUri({ ...item('a'), previewUrl: 'https://cdn/a-small.gif' })).toBe(
    'https://cdn/a-small.gif'
  );
});
