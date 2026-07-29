/**
 * #10 · skinToneVariations + createEmojiDatabase facade.
 */
import { skinToneVariations } from '../skinTone';
import { createEmojiDatabase } from '../database';
import { emojis } from '../../data';
import type { CompactEmoji } from '../../data';

const TONE_ENABLED: CompactEmoji = {
  e: '👋',
  n: 'waving hand',
  g: 1,
  o: 0,
  t: ['👋🏻', '👋🏼', '👋🏽', '👋🏾', '👋🏿'],
};
const PLAIN: CompactEmoji = { e: '🎉', n: 'party popper', g: 6, o: 1 };

test('skinToneVariations returns base + 5 tones for a tone-enabled emoji', () => {
  const vars = skinToneVariations(TONE_ENABLED);
  expect(vars).toHaveLength(6);
  expect(vars[0]).toEqual({ tone: 'none', glyph: '👋' });
  expect(vars.map((v) => v.glyph)).toEqual(['👋', '👋🏻', '👋🏼', '👋🏽', '👋🏾', '👋🏿']);
});

test('skinToneVariations returns just the base for a non-tone emoji', () => {
  expect(skinToneVariations(PLAIN)).toEqual([{ tone: 'none', glyph: '🎉' }]);
});

describe('createEmojiDatabase', () => {
  const db = createEmojiDatabase();

  test('exposes the bundled list and ranked search', () => {
    expect(db.all.length).toBeGreaterThan(1000);
    expect(db.search('rocket').some((e) => e.e === '🚀')).toBe(true);
  });

  test('autocomplete resolves shortcode prefixes to EmojiType', () => {
    const out = db.autocomplete('grin');
    expect(out.length).toBeGreaterThan(0);
    expect(out[0]).toMatchObject({ emoji: expect.any(String), name: expect.any(String) });
  });

  test('fromGlyph resolves a rendered glyph (tolerant of VS16)', () => {
    expect(db.fromGlyph('🚀').name.length).toBeGreaterThan(0);
    // A de-qualified heart (no VS16) still resolves to the same emoji name.
    expect(db.fromGlyph('❤').name).toBe(db.fromGlyph('❤️').name);
  });

  test('toneVariations + applyTone work through the facade', () => {
    const wave = emojis.find((e) => e.e === '👋');
    if (wave) {
      expect(db.toneVariations(wave).length).toBeGreaterThan(1);
      expect(db.applyTone(wave, 'dark')).not.toBe('👋');
    }
  });

  test('accepts a custom list', () => {
    const db2 = createEmojiDatabase([PLAIN]);
    expect(db2.all).toHaveLength(1);
    expect(db2.fromGlyph('🎉').name).toBe('party popper');
  });
});
