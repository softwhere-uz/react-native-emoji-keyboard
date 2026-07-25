/**
 * Skin-tone resolution + `EmojiType` construction. Verifies `applyTone` picks the
 * correct `t[idx]` glyph for a tone-enabled emoji and the base glyph for `'none'`,
 * that `slugify` matches the incumbent slug format, and that `toEmojiType` yields
 * an object matching the frozen `EmojiType` shape.
 */
import { emojis } from '../../data';
import type { CompactEmoji } from '../../data';
import type { EmojiType } from '../../types';
import { applyTone, slugify, toEmojiType, toneIndex } from '../skinTone';

/** First real emoji in the bundle that supports the full five-tone set. */
const toneEnabled = emojis.find(
  (e): e is CompactEmoji & { t: string[] } => Array.isArray(e.t) && e.t.length === 5
);

describe('applyTone', () => {
  it('returns e.t[idx] for each tone on a tone-enabled emoji', () => {
    expect(toneEnabled).toBeDefined();
    if (!toneEnabled) return;

    // SKIN_TONES index → t index: light→0, medium-light→1, medium→2, medium-dark→3, dark→4.
    expect(applyTone(toneEnabled, 'light')).toBe(toneEnabled.t[0]);
    expect(applyTone(toneEnabled, 'medium-light')).toBe(toneEnabled.t[1]);
    expect(applyTone(toneEnabled, 'medium')).toBe(toneEnabled.t[2]);
    expect(applyTone(toneEnabled, 'medium-dark')).toBe(toneEnabled.t[3]);
    expect(applyTone(toneEnabled, 'dark')).toBe(toneEnabled.t[4]);
  });

  it("returns the base glyph e.e for 'none'", () => {
    expect(toneEnabled).toBeDefined();
    if (!toneEnabled) return;
    expect(applyTone(toneEnabled, 'none')).toBe(toneEnabled.e);
  });

  it('falls back to the base glyph for an emoji without tones', () => {
    const plain: CompactEmoji = { e: '🎉', n: 'party popper', g: 6, o: 0 };
    expect(applyTone(plain, 'dark')).toBe('🎉');
    expect(applyTone(plain, 'none')).toBe('🎉');
  });

  it('toneIndex maps tones to 0..4 and none/unknown to -1', () => {
    expect(toneIndex('none')).toBe(-1);
    expect(toneIndex('light')).toBe(0);
    expect(toneIndex('dark')).toBe(4);
  });
});

describe('slugify', () => {
  it('lowercases and collapses non-alphanumerics to single underscores', () => {
    expect(slugify('grinning face')).toBe('grinning_face');
    expect(slugify('family: man, woman')).toBe('family_man_woman');
    expect(slugify('  Smileys & Emotion  ')).toBe('smileys_emotion');
  });
});

describe('toEmojiType', () => {
  it('yields an object matching the EmojiType shape', () => {
    expect(toneEnabled).toBeDefined();
    if (!toneEnabled) return;

    const glyph = applyTone(toneEnabled, 'dark');
    const payload = toEmojiType(toneEnabled, glyph, { alreadySelected: true });

    // Field-by-field against the frozen contract.
    const expected: EmojiType = {
      emoji: glyph,
      name: toneEnabled.n,
      slug: slugify(toneEnabled.n),
      unicode_version: String(toneEnabled.v ?? ''),
      toneEnabled: true,
      alreadySelected: true,
    };
    expect(payload).toEqual(expected);

    // Structural check: exactly the EmojiType keys, correct primitive types.
    expect(new Set(Object.keys(payload))).toEqual(
      new Set(['emoji', 'name', 'slug', 'unicode_version', 'toneEnabled', 'alreadySelected'])
    );
    expect(typeof payload.emoji).toBe('string');
    expect(typeof payload.name).toBe('string');
    expect(typeof payload.slug).toBe('string');
    expect(typeof payload.unicode_version).toBe('string');
    expect(typeof payload.toneEnabled).toBe('boolean');
  });

  it('marks toneEnabled false for a plain emoji and omits alreadySelected by default', () => {
    const plain: CompactEmoji = { e: '🎉', n: 'party popper', g: 6, o: 0, v: 2 };
    const payload = toEmojiType(plain, plain.e);
    expect(payload.toneEnabled).toBe(false);
    expect(payload.emoji).toBe('🎉');
    expect(payload.slug).toBe('party_popper');
    // Incumbent-style dotted version: integer 2 → "2.0".
    expect(payload.unicode_version).toBe('2.0');
    expect(payload.alreadySelected).toBeUndefined();
  });
});
