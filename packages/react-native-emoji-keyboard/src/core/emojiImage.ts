/**
 * Image-backed emoji rendering (§3 bundled glyph sets · §5 custom emoji ·
 * §7 animated custom emoji). Pure, platform-agnostic helpers that turn a glyph
 * into an image URL, so the cell can draw a consistent bundled glyph set
 * (Twemoji/Noto — identical across OSes) or a custom/animated image instead of
 * the system font. No React, no `react-native`.
 */
import type { RenderEmoji } from './internal-types';

const ZWJ = '‍'; // zero-width joiner
const VS16 = /️/g; // variation selector-16 (emoji presentation)

/**
 * Convert an emoji string to Twemoji's hyphenated hex codepoint filename,
 * mirroring `twemoji.toCodePoint`: the VS16 (U+FE0F) presentation selector is
 * stripped for non-ZWJ sequences (Twemoji filenames omit it), but kept when a
 * ZWJ is present (e.g. a multi-person sequence). Surrogate pairs are combined
 * to a single codepoint.
 */
export function toCodePoints(glyph: string, separator = '-'): string {
  const cleaned = glyph.indexOf(ZWJ) < 0 ? glyph.replace(VS16, '') : glyph;
  const points: string[] = [];
  let high = 0;
  for (let i = 0; i < cleaned.length; i += 1) {
    const code = cleaned.charCodeAt(i);
    if (high) {
      points.push((0x10000 + ((high - 0xd800) << 10) + (code - 0xdc00)).toString(16));
      high = 0;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      high = code;
    } else {
      points.push(code.toString(16));
    }
  }
  return points.join(separator);
}

/** Options for {@link twemojiUrl}. */
export type TwemojiUrlOptions = {
  /** `'svg'` (scalable, default) or `'png'` (72×72 raster). */
  format?: 'svg' | 'png';
  /** CDN base (no trailing slash). Defaults to the jsDelivr jdecked/twemoji mirror. */
  base?: string;
};

const DEFAULT_TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets';

/**
 * Build the Twemoji CDN URL for a glyph (a consistent, cross-OS glyph set served
 * remotely — no bundled sprite sheet). Returns `undefined` for an empty glyph.
 */
export function twemojiUrl(glyph: string, options: TwemojiUrlOptions = {}): string | undefined {
  if (!glyph) return undefined;
  const { format = 'svg', base = DEFAULT_TWEMOJI_BASE } = options;
  const code = toCodePoints(glyph);
  if (!code) return undefined;
  return format === 'png' ? `${base}/72x72/${code}.png` : `${base}/svg/${code}.svg`;
}

/**
 * Resolve the image URL to render for a cell, or `undefined` to fall back to the
 * system unicode glyph. A custom emoji's own `img` URL always wins; otherwise
 * the optional `resolver` (e.g. `twemojiImageResolver`) decides. Pure.
 */
export type EmojiImageResolver = (emoji: RenderEmoji) => string | undefined;

export function resolveEmojiImageUri(
  emoji: RenderEmoji,
  resolver?: EmojiImageResolver
): string | undefined {
  // A custom/animated emoji carries its own image URL in the data.
  if (emoji.source.img) return emoji.source.img;
  return resolver ? resolver(emoji) : undefined;
}

/** Ready-made resolver rendering every standard emoji as its Twemoji glyph. */
export const twemojiImageResolver: EmojiImageResolver = (emoji) => twemojiUrl(emoji.glyph);

/** Factory for a Twemoji resolver with custom format/CDN base. */
export function createTwemojiResolver(options: TwemojiUrlOptions): EmojiImageResolver {
  return (emoji) => twemojiUrl(emoji.glyph, options);
}
