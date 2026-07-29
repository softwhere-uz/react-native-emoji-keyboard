/**
 * #7 · useSearch — minChars gating + debounced results.
 */
import { act, renderHook } from '@testing-library/react';
import { emojis } from '../../data';
import { useSearch } from '../useSearch';

test('does not search below minChars; isSearching reflects the threshold', () => {
  const { result } = renderHook(() => useSearch(emojis as never, { minChars: 2 }));
  act(() => result.current.setQuery('g'));
  expect(result.current.isSearching).toBe(false);
  expect(result.current.results).toEqual([]);

  act(() => result.current.setQuery('gr'));
  expect(result.current.isSearching).toBe(true);
  expect(result.current.results.length).toBeGreaterThan(0);
});

test('debounces results but updates the query immediately', () => {
  jest.useFakeTimers();
  try {
    const { result } = renderHook(() => useSearch(emojis as never, { debounceMs: 200 }));
    act(() => result.current.setQuery('grinning'));
    // Query is immediate; results wait for the debounce window.
    expect(result.current.query).toBe('grinning');
    expect(result.current.results).toEqual([]);

    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current.results.length).toBeGreaterThan(0);
  } finally {
    jest.useRealTimers();
  }
});

test('with no options behaves like an immediate 1-char search', () => {
  const { result } = renderHook(() => useSearch(emojis as never));
  act(() => result.current.setQuery('cat'));
  expect(result.current.isSearching).toBe(true);
  expect(result.current.results.length).toBeGreaterThan(0);
});
