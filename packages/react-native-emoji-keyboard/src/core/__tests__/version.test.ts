/**
 * `filterByEmojiVersion` — emoji-version ("tofu") gating. Verifies newer emoji
 * are dropped at/above a target version, unknown-version records are kept, an
 * absent limit is a pass-through, and the real Emoji 17.0 bundle actually loses
 * its 16.0/17.0 additions when gated to an older platform.
 */
import { emojis } from '../../data';
import type { CompactEmoji } from '../../data';
import { filterByEmojiVersion } from '../version';

const at = (v: number | undefined): CompactEmoji => ({
  e: `e${v ?? 'x'}`,
  n: `emoji ${v ?? 'unknown'}`,
  g: 0,
  o: 0,
  ...(v == null ? {} : { v }),
});

describe('filterByEmojiVersion', () => {
  it('keeps emoji at or below the max version and drops newer ones', () => {
    const list = [at(0.6), at(13), at(15), at(15.1), at(16), at(17)];
    const kept = filterByEmojiVersion(list, 15).map((e) => e.v);
    expect(kept).toEqual([0.6, 13, 15]);
  });

  it('keeps records with an unknown (absent) version', () => {
    const list = [at(undefined), at(17)];
    const kept = filterByEmojiVersion(list, 15);
    expect(kept.map((e) => e.v)).toEqual([undefined]);
  });

  it('is a pass-through (same reference) when no max is given', () => {
    const list = [at(16), at(17)];
    expect(filterByEmojiVersion(list, undefined)).toBe(list);
    expect(filterByEmojiVersion(list, null)).toBe(list);
  });

  it('does not mutate the input', () => {
    const list = [at(13), at(17)];
    const copy = [...list];
    filterByEmojiVersion(list, 13);
    expect(list).toEqual(copy);
  });

  it('gates the real bundle: 16.0/17.0 emoji disappear at maxEmojiVersion=15', () => {
    const gated = filterByEmojiVersion(emojis, 15);
    expect(gated.length).toBeGreaterThan(0);
    expect(gated.length).toBeLessThan(emojis.length); // some newer emoji existed
    // Every surviving record is either unknown-version or <= 15.
    expect(gated.every((e) => e.v == null || e.v <= 15)).toBe(true);
    // And the full bundle really did contain newer-than-15 emoji.
    expect(emojis.some((e) => typeof e.v === 'number' && e.v > 15)).toBe(true);
  });
});
