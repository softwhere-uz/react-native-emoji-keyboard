/**
 * #2 · useFrequentlyUsed — count-ranked "frequently used" with cold-start
 * defaults, same-tick compose, and load/persist race-safety.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { useFrequentlyUsed } from '../useFrequentlyUsed';
import { createMemoryAdapter } from '../adapters';
import { DEFAULT_FREQUENT } from '../../constants';
import type { EmojiType } from '../../types';

const E = (glyph: string): EmojiType => ({
  emoji: glyph,
  name: glyph,
  slug: glyph,
  unicode_version: '1.0',
  toneEnabled: false,
});

test('cold-start returns the curated defaults before any usage', () => {
  const { result } = renderHook(() => useFrequentlyUsed({ enabled: false, limit: 8 }));
  expect(result.current.frequent).toHaveLength(8);
  expect(result.current.frequent.map((e) => e.emoji)).toEqual([...DEFAULT_FREQUENT].slice(0, 8));
});

test('ranks by usage count (frequency), highest first', () => {
  const { result } = renderHook(() => useFrequentlyUsed({ enabled: false, mode: 'frequency' }));
  act(() => {
    result.current.bump(E('🚀')); // 1
    result.current.bump(E('🎉')); // 1
    result.current.bump(E('🚀')); // 2
    result.current.bump(E('🚀')); // 3
    result.current.bump(E('🎉')); // 2
  });
  const glyphs = result.current.frequent.map((e) => e.emoji);
  expect(glyphs[0]).toBe('🚀'); // count 3
  expect(glyphs[1]).toBe('🎉'); // count 2
});

test('frecency lets a very recent pick edge out an equally-rare old one', () => {
  const { result } = renderHook(() => useFrequentlyUsed({ enabled: false, mode: 'frecency' }));
  act(() => {
    result.current.bump(E('🐌')); // count 1, older
    result.current.bump(E('⚡')); // count 1, newer
  });
  const glyphs = result.current.frequent.map((e) => e.emoji);
  // Same count → more recent (⚡) ranks first under frecency.
  expect(glyphs.indexOf('⚡')).toBeLessThan(glyphs.indexOf('🐌'));
});

test('a high count still beats a fresh single use under frecency', () => {
  const { result } = renderHook(() => useFrequentlyUsed({ enabled: false, mode: 'frecency' }));
  act(() => {
    result.current.bump(E('📈'));
    result.current.bump(E('📈'));
    result.current.bump(E('📈')); // count 3
    result.current.bump(E('🆕')); // count 1, most recent
  });
  const glyphs = result.current.frequent.map((e) => e.emoji);
  expect(glyphs[0]).toBe('📈');
});

test('persists counts and reloads them (race-safe)', async () => {
  const storage = createMemoryAdapter();
  const first = renderHook(() => useFrequentlyUsed({ storage, limit: 24 }));
  act(() => {
    first.result.current.bump(E('🌮'));
    first.result.current.bump(E('🌮'));
  });
  await waitFor(() =>
    expect(first.result.current.frequent.map((e) => e.emoji)).toContain('🌮')
  );

  // A fresh hook against the same storage loads the persisted count.
  const second = renderHook(() => useFrequentlyUsed({ storage, mode: 'frequency', limit: 24 }));
  await waitFor(() =>
    expect(second.result.current.frequent[0]?.emoji).toBe('🌮')
  );
});

test('clearFrequent wipes back to cold-start', () => {
  const { result } = renderHook(() => useFrequentlyUsed({ enabled: false }));
  act(() => {
    result.current.bump(E('🎯'));
    result.current.clearFrequent();
  });
  expect(result.current.frequent.map((e) => e.emoji)).toEqual(
    [...DEFAULT_FREQUENT].slice(0, result.current.frequent.length)
  );
});
