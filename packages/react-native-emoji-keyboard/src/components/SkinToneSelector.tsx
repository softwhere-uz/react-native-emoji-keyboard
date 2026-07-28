/**
 * `SkinToneSelector` — two related surfaces:
 *
 *  (a) {@link SkinToneRow}: a compact global tone picker (5 Fitzpatrick tones +
 *      `none`) shown in the header / `skinTonesContainer`, setting the default
 *      tone applied to all tone-enabled emoji.
 *
 *  (b) {@link SkinTonePopover}: a per-emoji popover opened on long-press of a
 *      tone-enabled cell. It lists that emoji's five tone variants; selecting one
 *      fires back the toned glyph. Animated with the built-in `Animated`
 *      (opacity + scale) — no reanimated. Positioning is best-effort from the
 *      long-pressed cell's window rect; when that's unavailable it falls back to
 *      a simple centered/inline row.
 */
import * as React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { applyTone } from '../core';
import type { RenderEmoji } from '../core';
import { SKIN_TONES } from '../constants';
import type { SkinTone } from '../types';
import { useTheme } from '../theme';
import { useReducedMotion } from './useReducedMotion';
import type { EmojiCellLayout } from './EmojiCell';

/** Representative swatch color per tone for the global picker dots. */
const TONE_SWATCH: Readonly<Record<SkinTone, string>> = {
  none: '#ffcc4d',
  light: '#f7dece',
  'medium-light': '#f3d2a2',
  medium: '#d5ab88',
  'medium-dark': '#af7e57',
  dark: '#7c533e',
};

// --- (a) global tone row -------------------------------------------------

export type SkinToneRowProps = {
  /** Currently-selected default tone. */
  skinTone: SkinTone;
  /** Fired when a tone swatch is tapped. */
  onSelect: (tone: SkinTone) => void;
};

/** The compact global tone picker rendered in the header. */
export function SkinToneRow({ skinTone, onSelect }: SkinToneRowProps): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={[rowStyles.container, { backgroundColor: theme.skinTonesContainer }]}>
      {SKIN_TONES.map((tone) => {
        const active = tone === skinTone;
        return (
          <Pressable
            key={tone}
            onPress={() => onSelect(tone)}
            accessibilityRole="button"
            accessibilityLabel={`Skin tone ${tone}`}
            accessibilityState={{ selected: active }}
            hitSlop={4}
            style={rowStyles.swatchHit}
          >
            <View
              style={[
                rowStyles.swatch,
                { backgroundColor: TONE_SWATCH[tone] },
                active ? { borderColor: theme.category.iconActive, borderWidth: 2 } : null,
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

// --- (b) per-emoji popover ----------------------------------------------

export type SkinTonePopoverProps = {
  /** The emoji this long-press popover acts on. */
  emoji: RenderEmoji;
  /** The long-pressed cell's window rect (drives positioning). */
  anchor: EmojiCellLayout | null;
  /** Emoji glyph size to render each variant at. */
  emojiSize: number;
  /** Fired with the chosen tone (and its resolved glyph via {@link applyTone}). */
  onSelectTone: (emoji: RenderEmoji, tone: SkinTone) => void;
  /** Fired when the popover should close without a selection. */
  onDismiss: () => void;
  /** Show the five tone variants. Off for emoji without tone support. Defaults to `true`. */
  showTones?: boolean;
  /** When set, renders a ⭐ Favorite/Unfavorite toggle at the start of the row. */
  onToggleFavorite?: () => void;
  /** Current favorite state of this emoji (drives the ★/☆ glyph + a11y state). */
  isFavorite?: boolean;
};

/**
 * Long-press action popover for an emoji. Optionally offers a ⭐ Favorite
 * toggle and/or the emoji's five skin-tone variants. Uses `Animated` opacity +
 * scale for entrance. Anchored above the long-pressed cell when a rect is
 * provided, else centered inline.
 */
export function SkinTonePopover({
  emoji,
  anchor,
  emojiSize,
  onSelectTone,
  onDismiss,
  showTones = true,
  onToggleFavorite,
  isFavorite = false,
}: SkinTonePopoverProps): React.ReactElement {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Respect "reduce motion": appear instantly instead of scaling/fading in.
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    Animated.timing(progress, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  }, [progress, reduceMotion]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });

  // Only the five toned variants (skip the `none` base) are offered here.
  const tones = showTones
    ? SKIN_TONES.filter((t): t is Exclude<SkinTone, 'none'> => t !== 'none')
    : [];
  const slots = tones.length + (onToggleFavorite ? 1 : 0);
  const rowWidth = slots * (emojiSize + 20) + 16;

  // Best-effort positioning: center the popover over the anchor, clamped to a
  // non-negative origin. Falls back to a centered inline row when no anchor.
  const positioned = anchor
    ? {
        position: 'absolute' as const,
        left: Math.max(8, anchor.x + anchor.width / 2 - rowWidth / 2),
        top: Math.max(8, anchor.y - (emojiSize + 28)),
      }
    : null;

  return (
    <>
      {/* Tap-catcher backdrop to dismiss. */}
      <Pressable
        accessibilityLabel="Dismiss emoji actions"
        onPress={onDismiss}
        style={popStyles.backdrop}
      />
      <Animated.View
        style={[
          popStyles.popover,
          { backgroundColor: theme.skinTonesContainer, opacity: progress, transform: [{ scale }] },
          positioned ?? popStyles.centered,
        ]}
      >
        {onToggleFavorite ? (
          <Pressable
            onPress={onToggleFavorite}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? `Unfavorite ${emoji.source.n}` : `Favorite ${emoji.source.n}`}
            accessibilityState={{ selected: isFavorite }}
            style={[popStyles.variant, tones.length > 0 ? popStyles.favoriteDivider : null]}
          >
            <Text
              allowFontScaling={false}
              style={[
                popStyles.variantGlyph,
                { fontSize: emojiSize, lineHeight: Math.round(emojiSize * 1.25) },
              ]}
            >
              {isFavorite ? '★' : '☆'}
            </Text>
          </Pressable>
        ) : null}
        {tones.map((tone) => (
          <Pressable
            key={tone}
            onPress={() => onSelectTone(emoji, tone)}
            accessibilityRole="button"
            accessibilityLabel={`${emoji.source.n}, ${tone}`}
            style={popStyles.variant}
          >
            <Text
              allowFontScaling={false}
              style={[
                popStyles.variantGlyph,
                { fontSize: emojiSize, lineHeight: Math.round(emojiSize * 1.25) },
              ]}
            >
              {applyTone(emoji.source, tone)}
            </Text>
          </Pressable>
        ))}
      </Animated.View>
    </>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  swatchHit: {
    padding: 4,
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderColor: 'transparent',
    borderWidth: 2,
  },
});

const popStyles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  popover: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 24,
    elevation: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  centered: {
    alignSelf: 'center',
  },
  variant: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  favoriteDivider: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(128,128,128,0.4)',
    marginRight: 4,
    paddingRight: 10,
  },
  variantGlyph: {
    textAlign: 'center',
    includeFontPadding: false,
  },
});

SkinToneRow.displayName = 'SkinToneRow';
SkinTonePopover.displayName = 'SkinTonePopover';
