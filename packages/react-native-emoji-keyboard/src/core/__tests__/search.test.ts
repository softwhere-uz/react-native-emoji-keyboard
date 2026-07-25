/**
 * `searchEmojis` — ranked, case-insensitive English search over the real
 * Emoji 17.0 bundle. Verifies "grin" surfaces a grinning face near the top,
 * case-insensitivity, a keyword-only match, and that empty queries return `[]`.
 */
import { emojis } from '../../data';
import { searchEmojis } from '../search';

describe('searchEmojis', () => {
  it('returns a grinning face near the top for "grin"', () => {
    const results = searchEmojis('grin', emojis);
    expect(results.length).toBeGreaterThan(0);

    const topNames = results.slice(0, 5).map((e) => e.n.toLowerCase());
    expect(topNames.some((n) => n.includes('grinning face'))).toBe(true);

    // The classic grinning face glyph should be present in the result set.
    expect(results.some((e) => e.e === '😀')).toBe(true);
  });

  it('is case-insensitive', () => {
    const lower = searchEmojis('grin', emojis).map((e) => e.e);
    const upper = searchEmojis('GRIN', emojis).map((e) => e.e);
    const mixed = searchEmojis('GrIn', emojis).map((e) => e.e);
    expect(upper).toEqual(lower);
    expect(mixed).toEqual(lower);
  });

  it('matches on a keyword even when the name does not contain the query', () => {
    // "waving hand" carries the keyword "hello" but its name has no "hello".
    const results = searchEmojis('hello', emojis);
    expect(results.some((e) => e.e === '👋')).toBe(true);
    // Confirms the match came via keywords, not the name.
    const wave = results.find((e) => e.e === '👋');
    expect(wave?.n.toLowerCase().includes('hello')).toBe(false);
  });

  it('returns [] for an empty or whitespace-only query', () => {
    expect(searchEmojis('', emojis)).toEqual([]);
    expect(searchEmojis('   ', emojis)).toEqual([]);
  });

  it('de-duplicates by glyph', () => {
    const results = searchEmojis('face', emojis);
    const glyphs = results.map((e) => e.e);
    expect(new Set(glyphs).size).toBe(glyphs.length);
  });
});
