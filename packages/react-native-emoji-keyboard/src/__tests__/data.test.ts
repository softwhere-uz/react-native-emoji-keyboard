/**
 * Data-package integrity guard. Asserts the bundled emoji data
 * matches the frozen v0.1 contract: Emoji 17.0, 1914 emoji, 9 groups (no group 2 /
 * "component"), 323 five-tone emoji, and a stable sort by (group id, then order).
 */
import { emojis, groups, meta } from '../data';

describe('bundled emoji data', () => {
  it('reports Emoji 17.0 and a self-consistent count', () => {
    expect(meta.emojiVersion).toBe('17.0');
    expect(meta.count).toBe(emojis.length);
  });

  it('has exactly 1914 emoji and 9 groups', () => {
    expect(emojis.length).toBe(1914);
    expect(groups.length).toBe(9);
  });

  it('contains no emoji from group 2 (the omitted "component" group)', () => {
    expect(emojis.some((e) => e.g === 2)).toBe(false);
    // Groups present are exactly {0,1,3,4,5,6,7,8,9}.
    const present = Array.from(new Set(emojis.map((e) => e.g))).sort((a, b) => a - b);
    expect(present).toEqual([0, 1, 3, 4, 5, 6, 7, 8, 9]);
    expect(groups.map((g) => g.id).sort((a, b) => a - b)).toEqual([0, 1, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('has exactly 323 emoji with a 5-length tone array', () => {
    const toned = emojis.filter((e) => Array.isArray(e.t) && e.t.length === 5);
    expect(toned).toHaveLength(323);
    // Any present `t` array must be exactly 5 tone glyphs (never a partial set).
    const badLength = emojis.filter((e) => Array.isArray(e.t) && e.t.length !== 5);
    expect(badLength).toHaveLength(0);
  });

  it('is sorted non-decreasing by (group id, then order)', () => {
    for (let i = 1; i < emojis.length; i += 1) {
      const prev = emojis[i - 1];
      const cur = emojis[i];
      if (!prev || !cur) throw new Error('unexpected sparse emoji array');
      const ordered = prev.g < cur.g || (prev.g === cur.g && prev.o <= cur.o);
      expect(ordered).toBe(true);
    }
  });
});
