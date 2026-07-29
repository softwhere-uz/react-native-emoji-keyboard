/**
 * #3 · useReactionHistory — used-first padding, recent/frequent ranking,
 * default reaction, and persistence.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { useReactionHistory } from '../useReactionHistory';
import { createMemoryAdapter } from '../adapters';

const BASE = ['👍', '❤️', '😂', '😮', '😢', '🙏'] as const;

test('with no history, shows the base set capped to limit; default is base[0]', () => {
  const { result } = renderHook(() =>
    useReactionHistory({ enabled: false, base: BASE, limit: 4 })
  );
  expect(result.current.reactions).toEqual(['👍', '❤️', '😂', '😮']);
  expect(result.current.defaultReaction).toBe('👍');
});

test('recent mode leads with the most recently used, padded with base', () => {
  const { result } = renderHook(() =>
    useReactionHistory({ enabled: false, base: BASE, limit: 6, mode: 'recent' })
  );
  act(() => {
    result.current.recordReaction('🎉'); // not in base
    result.current.recordReaction('🙏'); // in base, now most recent
  });
  // Most recent first (🙏, 🎉), then remaining base, deduped.
  expect(result.current.reactions.slice(0, 2)).toEqual(['🙏', '🎉']);
  expect(result.current.defaultReaction).toBe('🙏');
  expect(new Set(result.current.reactions).size).toBe(result.current.reactions.length); // deduped
});

test('frequent mode ranks by usage count', () => {
  const { result } = renderHook(() =>
    useReactionHistory({ enabled: false, base: BASE, limit: 6, mode: 'frequent' })
  );
  act(() => {
    result.current.recordReaction('🔥');
    result.current.recordReaction('✨');
    result.current.recordReaction('🔥');
    result.current.recordReaction('🔥'); // count 3
    result.current.recordReaction('✨'); // count 2
  });
  expect(result.current.reactions[0]).toBe('🔥');
  expect(result.current.reactions[1]).toBe('✨');
});

test('persists and reloads history', async () => {
  const storage = createMemoryAdapter();
  const first = renderHook(() => useReactionHistory({ storage, base: BASE, mode: 'recent' }));
  act(() => first.result.current.recordReaction('🥳'));
  await waitFor(() => expect(first.result.current.reactions[0]).toBe('🥳'));

  const second = renderHook(() => useReactionHistory({ storage, base: BASE, mode: 'recent' }));
  await waitFor(() => expect(second.result.current.reactions[0]).toBe('🥳'));
});

test('clear resets to the base set', () => {
  const { result } = renderHook(() => useReactionHistory({ enabled: false, base: BASE }));
  act(() => {
    result.current.recordReaction('💯');
    result.current.clear();
  });
  expect(result.current.reactions).toEqual([...BASE].slice(0, result.current.reactions.length));
});
