/**
 * Render-support detection (§3 · rendering) — a best-effort, web-only check for
 * whether the current platform can actually draw a given emoji, so brand-new
 * emoji don't show as □ "tofu". It rasterizes the glyph on an offscreen canvas
 * and compares it against a control tofu render; if they match (or nothing was
 * drawn) the emoji is treated as unsupported.
 *
 * On native or anywhere without a canvas (React Native, SSR, jsdom) the checker
 * reports `available: false` and treats everything as supported — the feature is
 * opt-in and never removes emoji where it cannot actually measure them. The
 * pixel comparisons are pure and unit-tested; the canvas orchestration is
 * web-verify-only.
 */
import * as React from 'react';
import type { CompactEmoji } from '../data';

/** True if the two pixel buffers differ in any byte (length mismatch counts). */
export function pixelsDiffer(a: ArrayLike<number>, b: ArrayLike<number>): boolean {
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return true;
  }
  return false;
}

/** True if any pixel has a non-zero alpha (something was actually drawn). */
export function hasInk(pixels: ArrayLike<number>): boolean {
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] !== 0) return true;
  }
  return false;
}

/** A cached per-glyph render-support checker. */
export type EmojiSupportChecker = {
  /** Whether a real canvas is available (else every glyph reports supported). */
  available: boolean;
  /** Whether the platform appears able to render `glyph`. */
  isSupported: (glyph: string) => boolean;
};

/** The always-supported checker used on native / SSR / no-canvas. */
const ALWAYS_SUPPORTED: EmojiSupportChecker = { available: false, isSupported: () => true };

/**
 * Build a canvas-backed checker, or the always-supported fallback when no canvas
 * exists. Results are cached per glyph.
 */
export function createEmojiSupportChecker(size = 18): EmojiSupportChecker {
  const doc = typeof document !== 'undefined' ? document : undefined;
  const canvas = doc && typeof doc.createElement === 'function' ? doc.createElement('canvas') : null;
  const ctx =
    canvas && typeof canvas.getContext === 'function'
      ? (canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D | null)
      : null;
  if (!canvas || !ctx) return ALWAYS_SUPPORTED;

  canvas.width = size;
  canvas.height = size;
  ctx.textBaseline = 'top';
  ctx.font = `${size - 2}px sans-serif`;

  const render = (glyph: string): Uint8ClampedArray => {
    ctx.clearRect(0, 0, size, size);
    ctx.fillText(glyph, 0, 0);
    return ctx.getImageData(0, 0, size, size).data;
  };

  // Control: U+FFFF (a noncharacter no font has) → the platform's tofu box.
  const tofu = render('￿');
  const cache = new Map<string, boolean>();

  return {
    available: true,
    isSupported(glyph: string): boolean {
      const cached = cache.get(glyph);
      if (cached !== undefined) return cached;
      const pixels = render(glyph);
      const supported = hasInk(pixels) && pixelsDiffer(pixels, tofu);
      cache.set(glyph, supported);
      return supported;
    },
  };
}

/**
 * Hook: a memoized include-predicate that drops emoji the platform can't render,
 * or `undefined` when detection is disabled or unavailable (so callers can skip
 * filtering entirely). One checker per enabled lifetime; per-glyph cached.
 */
export function useEmojiSupport(
  enabled: boolean
): ((emoji: CompactEmoji) => boolean) | undefined {
  return React.useMemo(() => {
    if (!enabled) return undefined;
    const checker = createEmojiSupportChecker();
    if (!checker.available) return undefined;
    return (emoji: CompactEmoji) => checker.isSupported(emoji.e);
  }, [enabled]);
}
