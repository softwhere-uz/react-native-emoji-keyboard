/**
 * §8 · `useAsyncEmojiData` — pluggable sync/async emoji sources with race-safe
 * resolution. Exercised through the public hook API with `renderHook`.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { emojis as BUNDLED } from '../../data';
import type { CompactEmoji } from '../../data';
import { useAsyncEmojiData } from '../useAsyncEmojiData';
import type { EmojiSource } from '../useAsyncEmojiData';

const SAMPLE: CompactEmoji[] = [
  { e: '🙂', n: 'slight smile', g: 0, o: 0 },
  { e: '🎉', n: 'party popper', g: 6, o: 1 },
];

test('no source resolves to the bundled set synchronously', () => {
  const { result } = renderHook(() => useAsyncEmojiData());
  expect(result.current.loading).toBe(false);
  expect(result.current.error).toBeNull();
  expect(result.current.emojis).toBe(BUNDLED);
  expect(result.current.emojis.length).toBeGreaterThan(1000);
});

test('an array source is used directly, no loading', () => {
  const { result } = renderHook(() => useAsyncEmojiData(SAMPLE));
  expect(result.current.loading).toBe(false);
  expect(result.current.emojis).toEqual(SAMPLE);
});

test('a synchronous function source resolves without a loading state', () => {
  const source: EmojiSource = () => SAMPLE;
  const { result } = renderHook(() => useAsyncEmojiData(source));
  expect(result.current.loading).toBe(false);
  expect(result.current.emojis).toEqual(SAMPLE);
});

test('an async function source reports loading then swaps in the result', async () => {
  const source: EmojiSource = () => Promise.resolve(SAMPLE);
  const { result } = renderHook(() => useAsyncEmojiData(source));

  // First commit: loading, empty.
  expect(result.current.loading).toBe(true);
  expect(result.current.emojis).toEqual([]);

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.emojis).toEqual(SAMPLE);
  expect(result.current.error).toBeNull();
});

test('a rejected async source surfaces the error and stops loading', async () => {
  const boom = new Error('network down');
  const source: EmojiSource = () => Promise.reject(boom);
  const { result } = renderHook(() => useAsyncEmojiData(source));

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toBe(boom);
  expect(result.current.emojis).toEqual([]);
});

test('a stale async resolution is ignored when the source changes', async () => {
  // slow source resolves AFTER we switch to the fast one; the fast result wins.
  let resolveSlow: (v: CompactEmoji[]) => void = () => {};
  const slow: EmojiSource = () => new Promise<CompactEmoji[]>((r) => (resolveSlow = r));
  const fast: EmojiSource = () => Promise.resolve(SAMPLE);

  const { result, rerender } = renderHook(({ source }) => useAsyncEmojiData(source), {
    initialProps: { source: slow },
  });
  expect(result.current.loading).toBe(true);

  rerender({ source: fast });
  await waitFor(() => expect(result.current.emojis).toEqual(SAMPLE));

  // The slow source now resolves late — it must NOT clobber the fast result.
  act(() => resolveSlow([{ e: '💥', n: 'boom', g: 0, o: 0 }]));
  expect(result.current.emojis).toEqual(SAMPLE);
});
