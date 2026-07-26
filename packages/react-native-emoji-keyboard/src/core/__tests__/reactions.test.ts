/**
 * `resolveReaction` — turns a reaction glyph into a full `EmojiType` using the
 * bundle, tolerant to variation selectors, and falling back gracefully for
 * unknown glyphs. Also checks every default quick-reaction actually resolves.
 */
import { DEFAULT_QUICK_REACTIONS, resolveReaction } from '../reactions';

describe('resolveReaction', () => {
  it('matches a plain thumbs-up (no U+FE0F) to the stored variation-selector form', () => {
    const r = resolveReaction('👍');
    expect(r.name).toBe('thumbs up');
    expect(r.slug).toBe('thumbs_up');
    expect(r.toneEnabled).toBe(true);
    // The displayed glyph is preserved exactly as passed (not the stored form).
    expect(r.emoji).toBe('👍');
  });

  it('resolves the red heart', () => {
    expect(resolveReaction('❤️').name).toBe('red heart');
  });

  it('falls back to a minimal EmojiType for an unknown glyph', () => {
    expect(resolveReaction('A')).toEqual({
      emoji: 'A',
      name: 'A',
      slug: '',
      unicode_version: '',
      toneEnabled: false,
    });
  });

  it('resolves every default quick-reaction to a real bundle record', () => {
    for (const glyph of DEFAULT_QUICK_REACTIONS) {
      const r = resolveReaction(glyph);
      // A real record yields a non-empty slug; the fallback yields ''.
      expect(r.slug).not.toBe('');
      expect(r.emoji).toBe(glyph);
    }
  });
});
