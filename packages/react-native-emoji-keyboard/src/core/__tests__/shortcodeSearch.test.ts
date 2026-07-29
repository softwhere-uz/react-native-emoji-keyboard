/**
 * #6 · searchByShortcodePrefix — inline :shortcode: autocomplete ranking.
 */
import { searchByShortcodePrefix } from '../shortcodeSearch';
import type { CompactEmoji } from '../../data';

const LIST: CompactEmoji[] = [
  { e: '😀', n: 'grinning face', g: 0, o: 0, s: ['grinning'] },
  { e: '🙂', n: 'happy', g: 0, o: 1, s: ['happy', 'smile'] },
  { e: '🍔', n: 'hamburger', g: 4, o: 2, s: ['hamburger'] },
  { e: '👋', n: 'waving hand', g: 1, o: 3, s: ['wave'] },
];

test('ranks shortcode-prefix matches above name-word-prefix matches', () => {
  // "ha" matches shortcodes happy/hamburger (tier 1) and the name word "hand"
  // in "waving hand" (tier 2) — shortcode matches come first.
  const glyphs = searchByShortcodePrefix('ha', LIST, { minChars: 2 }).map((e) => e.emoji);
  expect(glyphs).toEqual(['🙂', '🍔', '👋']);
});

test('an exact shortcode ranks first', () => {
  const out = searchByShortcodePrefix('happy', LIST);
  expect(out[0]?.emoji).toBe('🙂');
});

test('accepts a leading/trailing colon', () => {
  expect(searchByShortcodePrefix(':wave:', LIST).map((e) => e.emoji)).toEqual(['👋']);
  expect(searchByShortcodePrefix(':wav', LIST).map((e) => e.emoji)).toEqual(['👋']);
});

test('falls back to a name-word prefix when no shortcode matches', () => {
  // "grin" isn't a shortcode here but is a name word of "grinning face".
  const out = searchByShortcodePrefix('grin', LIST);
  expect(out.map((e) => e.emoji)).toContain('😀');
});

test('returns nothing below minChars and respects the limit', () => {
  expect(searchByShortcodePrefix('h', LIST, { minChars: 2 })).toEqual([]);
  expect(searchByShortcodePrefix('ha', LIST, { limit: 1 })).toHaveLength(1);
});

test('emits full EmojiType payloads', () => {
  const [first] = searchByShortcodePrefix('wave', LIST);
  expect(first).toMatchObject({ emoji: '👋', name: 'waving hand', slug: expect.any(String) });
});
