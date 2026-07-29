/**
 * §3/§5/§7 · image-backed emoji — Twemoji codepoint/URL derivation and the
 * custom-emoji-wins image resolver.
 */
import {
  toCodePoints,
  twemojiUrl,
  resolveEmojiImageUri,
  twemojiImageResolver,
  createTwemojiResolver,
} from '../emojiImage';
import type { RenderEmoji } from '../internal-types';

const render = (glyph: string, img?: string): RenderEmoji => ({
  glyph,
  source: { e: glyph, n: 'x', g: 0, o: 0, ...(img ? { img } : {}) },
});

test('toCodePoints combines surrogate pairs and strips VS16 for non-ZWJ glyphs', () => {
  expect(toCodePoints('👋')).toBe('1f44b');
  expect(toCodePoints('❤️')).toBe('2764'); // U+2764 U+FE0F → FE0F dropped
});

test('toCodePoints keeps VS16 and joins ZWJ sequences', () => {
  // 👨‍👩‍👧 family = 1F468 ZWJ 1F469 ZWJ 1F467 (ZWJ present → nothing stripped)
  expect(toCodePoints('👨‍👩‍👧')).toBe('1f468-200d-1f469-200d-1f467');
});

test('twemojiUrl builds svg by default and png on request', () => {
  expect(twemojiUrl('👋')).toBe(
    'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/1f44b.svg'
  );
  expect(twemojiUrl('👋', { format: 'png' })).toBe(
    'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/72x72/1f44b.png'
  );
});

test('twemojiUrl honors a custom CDN base and rejects empty input', () => {
  expect(twemojiUrl('👋', { base: 'https://cdn.example.com/tw' })).toBe(
    'https://cdn.example.com/tw/svg/1f44b.svg'
  );
  expect(twemojiUrl('')).toBeUndefined();
});

test('resolveEmojiImageUri: a custom emoji image URL always wins', () => {
  const custom = render('🙂', 'https://cdn.example.com/party.gif');
  // Even with a resolver present, the data-carried image URL is used.
  expect(resolveEmojiImageUri(custom, twemojiImageResolver)).toBe(
    'https://cdn.example.com/party.gif'
  );
});

test('resolveEmojiImageUri: falls back to the resolver, else the system glyph', () => {
  const plain = render('👋');
  expect(resolveEmojiImageUri(plain, twemojiImageResolver)).toBe(twemojiUrl('👋'));
  expect(resolveEmojiImageUri(plain)).toBeUndefined(); // no resolver → system text
});

test('createTwemojiResolver applies its format/base', () => {
  const resolver = createTwemojiResolver({ format: 'png' });
  expect(resolver(render('👋'))).toBe(twemojiUrl('👋', { format: 'png' }));
});
