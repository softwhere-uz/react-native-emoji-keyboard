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

  describe('emoticons', () => {
    it('maps ":)" to the slightly-smiling face at the top', () => {
      const results = searchEmojis(':)', emojis);
      expect(results[0]?.e).toBe('🙂');
    });

    it('maps "<3" to the red heart at the top', () => {
      const results = searchEmojis('<3', emojis);
      expect(results[0]?.e).toBe('❤️');
    });

    it('matches array-valued emoticons case-insensitively ("xd" and "XD")', () => {
      const lower = searchEmojis('xd', emojis);
      const upper = searchEmojis('XD', emojis);
      expect(lower[0]?.e).toBe('😆');
      expect(upper[0]?.e).toBe('😆');
    });
  });

  describe('multi-word queries', () => {
    it('surfaces the red heart at the top for "red heart", either word order', () => {
      const forward = searchEmojis('red heart', emojis);
      const reverse = searchEmojis('heart red', emojis);
      expect(forward[0]?.e).toBe('❤️');
      expect(reverse[0]?.e).toBe('❤️');
      // Token matching is an AND over tokens, so the result SET is
      // order-independent (word order may only refine the ranking).
      const set = (r: typeof forward) => r.map((e) => e.e).sort();
      expect(set(reverse)).toEqual(set(forward));
    });

    it('requires every token to match (one nonsense token → no results)', () => {
      expect(searchEmojis('grinning xzqwv', emojis)).toEqual([]);
    });

    it('ignores redundant internal whitespace', () => {
      const spaced = searchEmojis('red   heart', emojis).map((e) => e.e);
      const single = searchEmojis('red heart', emojis).map((e) => e.e);
      expect(spaced).toEqual(single);
    });

    it('boosts a contiguous phrase match over separately-tagged tokens', () => {
      // 😮 "face with open mouth" contains the whole phrase; a cat merely tagged
      // "open" + "mouth" must not outrank it.
      const results = searchEmojis('open mouth', emojis);
      expect(results[0]?.n.toLowerCase()).toContain('open mouth');
    });
  });

  describe('relevance (regression guards)', () => {
    it('ranks a smiley — not a cat or a lollipop — first for "smile"', () => {
      expect(searchEmojis('smile', emojis)[0]?.n.toLowerCase()).toContain('face');
    });

    it('ranks a laughing face first for "lol" and keeps the lollipop out of the top 3', () => {
      const results = searchEmojis('lol', emojis);
      expect(results[0]?.n.toLowerCase()).toContain('face');
      expect(results.slice(0, 3).some((e) => e.e === '🍭')).toBe(false);
    });

    it('ranks faces — not short animal names — first for the broad query "face"', () => {
      expect(searchEmojis('face', emojis)[0]?.n.toLowerCase()).toContain('face');
    });
  });
});
