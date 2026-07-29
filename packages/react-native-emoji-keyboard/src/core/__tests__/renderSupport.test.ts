/**
 * §3 · render-support detection — pure pixel comparisons + the no-canvas
 * fallback (jsdom has no 2d canvas, so it exercises the "assume supported" path).
 */
import { createEmojiSupportChecker, hasInk, pixelsDiffer } from '../renderSupport';

test('pixelsDiffer detects any byte difference or length mismatch', () => {
  expect(pixelsDiffer([0, 0, 0, 0], [0, 0, 0, 0])).toBe(false);
  expect(pixelsDiffer([0, 0, 0, 0], [0, 1, 0, 0])).toBe(true);
  expect(pixelsDiffer([0, 0], [0, 0, 0, 0])).toBe(true);
});

test('hasInk is true only when some pixel has non-zero alpha', () => {
  // RGBA quads; alpha is every 4th byte.
  expect(hasInk([255, 255, 255, 0])).toBe(false);
  expect(hasInk([0, 0, 0, 0, 10, 10, 10, 5])).toBe(true);
});

test('without a real canvas the checker reports unavailable and supports all', () => {
  // jsdom returns null for getContext('2d') → fallback checker.
  const checker = createEmojiSupportChecker();
  expect(checker.available).toBe(false);
  expect(checker.isSupported('🆕')).toBe(true);
  expect(checker.isSupported('👋')).toBe(true);
});
