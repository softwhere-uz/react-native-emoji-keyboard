/**
 * §6 · category-swipe stepping — adjacency with edge clamping (no wrap).
 */
import { adjacentCategory } from '../categoryNav';

const CATS = ['recently_used', 'smileys_emotion', 'people_body', 'flags'] as const;

test('steps to the next / previous category', () => {
  expect(adjacentCategory(CATS, 'smileys_emotion', 1)).toBe('people_body');
  expect(adjacentCategory(CATS, 'people_body', -1)).toBe('smileys_emotion');
});

test('clamps at the ends (no wrap-around)', () => {
  expect(adjacentCategory(CATS, 'flags', 1)).toBeUndefined();
  expect(adjacentCategory(CATS, 'recently_used', -1)).toBeUndefined();
});

test('an unknown current snaps to the first (next) or last (prev)', () => {
  expect(adjacentCategory(CATS, undefined, 1)).toBe('recently_used');
  expect(adjacentCategory(CATS, undefined, -1)).toBe('flags');
  expect(adjacentCategory(CATS, 'search', 1)).toBe('recently_used');
});

test('an empty list yields undefined', () => {
  expect(adjacentCategory([], 'x', 1)).toBeUndefined();
});
